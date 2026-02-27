"""LearnBible Admin Editor — Streamlit app.

Run:
    cd editor
    python -m streamlit run editor.py
"""

from __future__ import annotations

import json
from typing import Any

import streamlit as st

from lib import db
from lib.prompts import IMPORT_PROMPT

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="LearnBible Editor",
    page_icon="📖",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────
st.markdown(
    """
<style>
/* Tighten table header/row gap */
.table-header {
    padding-bottom: 2px;
    margin-bottom: 0;
}
/* Prevent header text wrapping */
.table-header span {
    white-space: nowrap;
    font-weight: 600;
    font-size: 0.85rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
/* Compact row buttons */
div[data-testid="stHorizontalBlock"] .stButton > button {
    padding: 2px 8px;
    height: auto;
}
/* Small word chip buttons in blanks editor */
.word-row div[data-testid="stHorizontalBlock"] .stButton > button {
    padding: 1px 6px;
    font-size: 0.85rem;
    min-height: 0;
}
</style>
""",
    unsafe_allow_html=True,
)


# ── Cached reference data ─────────────────────────────────────────────────────

@st.cache_data(ttl=300)
def load_translations() -> list[dict]:
    return db.get_translations()


@st.cache_data(ttl=300)
def load_books() -> list[dict]:
    return db.get_books()


@st.cache_data(ttl=600)
def _book_id_map() -> dict[int, str]:
    return {b["id"]: b["name"] for b in db.get_books()}


def _book_name_for_id(book_id: int | None) -> str:
    if book_id is None:
        return "Unknown"
    return _book_id_map().get(book_id, f"Book {book_id}")


# ── Cached search (so word-chip reruns hit cache, not Supabase) ───────────────

@st.cache_data(ttl=60)
def cached_search(translation_id: str, book_id, chapter, verse, text_search: str, limit: int = 300) -> list[dict]:
    return db.search_verses(translation_id, book_id, chapter, verse, text_search, limit)


# ── Session state ─────────────────────────────────────────────────────────────

def _close_edit_dialog() -> None:
    """Clear edit dialog state — used as on_change on filter widgets."""
    st.session_state.edit_verse_ref_id = None


def _init_session() -> None:
    defaults: dict[str, Any] = {
        # editor modal
        "edit_verse_ref_id": None,
        "edit_translation_id": None,
        # import modal
        "show_import_modal": False,
        "import_step": 1,
        "import_verses_raw": None,
        "import_previewed": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


_init_session()


# ── Verse Editor Modal ────────────────────────────────────────────────────────
# NOTE: Called unconditionally from main() when edit_verse_ref_id is set.
# This is required so that button clicks inside the dialog (word chips, etc.)
# trigger a natural rerun that keeps the dialog alive.

@st.dialog("Edit Verse", width="large")
def verse_editor_modal(verse_ref_id: str, translation_id: str) -> None:
    detail = db.get_verse_detail(verse_ref_id, translation_id)
    if not detail:
        st.error("Could not load verse detail.")
        if st.button("Close"):
            st.session_state.edit_verse_ref_id = None
            st.rerun()
        return

    tab_details, tab_games = st.tabs(["📖 Verse Details", "🎮 Games"])

    # ── Tab 1: Verse Details ─────────────────────────────────────────────────
    with tab_details:
        # Translation + Book row (book_id shown on hover)
        col_trans, col_book = st.columns(2)
        col_trans.text_input("Translation", value=translation_id, disabled=True)
        col_book.text_input(
            "Book",
            value=detail["book_name"],
            disabled=True,
            help=f"book_id: {detail['book_id']}",
        )

        # Chapter + Verse (read-only; verse_ref_id shown on hover of Verse)
        col_ch, col_v = st.columns(2)
        col_ch.text_input("Chapter", value=str(detail["chapter"]), disabled=True)
        col_v.text_input(
            "Verse",
            value=str(detail["verse"]),
            disabled=True,
            help=f"verse_ref_id: {detail['verse_ref_id']}",
        )

        # Text (verse_text_id shown on hover)
        new_text = st.text_area(
            "Text",
            value=detail["text"],
            height=100,
            key="edit_text",
            help=f"verse_text_id: {detail['verse_text_id']}",
        )

        st.divider()
        st.markdown("**Drip Settings**")
        rank_val = detail["global_rank"] if detail["global_rank"] is not None else (db.get_max_rank() + 1)
        new_rank = st.number_input(
            "Global Rank",
            min_value=1,
            value=int(rank_val),
            step=1,
            key="edit_rank",
            help="Lower = introduced sooner to new users",
        )
        new_released = st.toggle("Released", value=bool(detail["released"]), key="edit_released")

        if detail["global_difficulty"] is not None:
            st.metric("Difficulty (recalculated nightly)", f"{detail['global_difficulty']:.0f}")

        if new_rank <= 10 and new_released:
            st.warning("⚠️ Rank ≤ 10 means new users will see this verse immediately.")

        if st.button("💾 Save Changes", type="primary", key="save_details_btn"):
            try:
                db.save_verse(
                    verse_ref_id=verse_ref_id,
                    chapter=detail["chapter"],
                    verse=detail["verse"],
                    verse_text_id=detail["verse_text_id"],
                    text=new_text,
                    rank=new_rank,
                    released=new_released,
                )
                st.cache_data.clear()
            except Exception as e:
                st.error(f"Save failed: {e}")

    # ── Tab 2: Games ─────────────────────────────────────────────────────────
    with tab_games:
        st.markdown("#### BLANKS")
        text = detail["text"]
        words = text.split(" ")

        # Existing blanks from DB
        existing_indices: list[int] = []
        if detail["answer_json"] and "word_indices" in detail["answer_json"]:
            existing_indices = detail["answer_json"]["word_indices"]

        # Selection state — scoped to this verse, seeded from DB on first open
        sel_key = f"blanks_{verse_ref_id}"
        if sel_key not in st.session_state:
            st.session_state[sel_key] = list(existing_indices[:2])

        selected: list[int] = st.session_state[sel_key]

        st.caption("Click exactly **2 words** to blank them out. Click a yellow word to deselect it.")

        # Word chips — 6 per row, proportional column widths to avoid wrapping
        COLS = 6
        for row_start in range(0, len(words), COLS):
            row_words = words[row_start : row_start + COLS]
            # Size each column proportionally to word length (min 3 units)
            col_widths = [max(len(w), 3) for w in row_words]
            cols = st.columns(col_widths)
            for ci, (col, word) in enumerate(zip(cols, row_words)):
                gi = row_start + ci
                is_sel = gi in selected
                btn_type = "primary" if is_sel else "secondary"
                if col.button(word, key=f"word_{verse_ref_id}_{gi}", type=btn_type, help=f"idx {gi}", use_container_width=True):
                    if is_sel:
                        selected.remove(gi)
                    else:
                        if len(selected) >= 2:
                            selected.pop(0)
                        selected.append(gi)
                    st.session_state[sel_key] = selected
                    st.rerun()  # force full rerender so button types update immediately

        n_sel = len(selected)
        if n_sel == 2:
            sel_sorted = sorted(selected)
            sel_words = [words[i] if i < len(words) else "?" for i in sel_sorted]
            st.success(f"2/2 — **{sel_words[0]}** (idx {sel_sorted[0]}) · **{sel_words[1]}** (idx {sel_sorted[1]})")
        else:
            st.info(f"{n_sel}/2 selected")

        if st.button("💾 Save Question", type="primary", disabled=(n_sel != 2), key="save_question_btn"):
            try:
                db.save_question(
                    verse_ref_id=verse_ref_id,
                    translation_id=translation_id,
                    word_indices=selected,
                    text=text,
                    question_id=detail.get("question_id"),
                )
                st.cache_data.clear()
            except Exception as e:
                st.toast(f"Save failed: {e}", icon="🚨")


# ── Import Modal ──────────────────────────────────────────────────────────────

@st.dialog("📥 Import Verses", width="large")
def import_modal() -> None:
    if st.session_state.import_step == 1:
        _import_step1()
    else:
        _import_step2()


def _import_step1() -> None:
    st.markdown("### Step 1 — Get JSON from an LLM")
    st.markdown("1. Copy the prompt below and paste it **+ your topic** into ChatGPT or Claude:")
    st.code(IMPORT_PROMPT, language="text")

    st.divider()
    st.markdown("2. Paste the JSON response below, or upload a `.json` file:")

    pasted = st.text_area("Paste JSON here", height=200, key="import_json_paste")
    uploaded = st.file_uploader("Or upload JSON file", type=["json"], key="import_upload")

    raw_json: str | None = None
    if uploaded is not None:
        raw_json = uploaded.read().decode("utf-8")
    elif pasted.strip():
        raw_json = pasted.strip()

    if st.button("Preview Import →", type="primary", disabled=raw_json is None):
        try:
            parsed = json.loads(raw_json)  # type: ignore[arg-type]
            verses_in = parsed.get("verses") if isinstance(parsed, dict) else parsed
            if not isinstance(verses_in, list):
                st.error("JSON must contain a 'verses' array.")
                return
            translation_id = parsed.get("translation", "NIV") if isinstance(parsed, dict) else "NIV"
            st.session_state.import_verses_raw = {"verses": verses_in, "translation": translation_id}
            st.session_state.import_step = 2
            # No st.rerun() — dialog re-renders naturally on next interaction.
            # The step change is immediate for the current render pass.
            st.rerun()
        except json.JSONDecodeError as e:
            st.error(f"Invalid JSON: {e}")


def _import_step2() -> None:
    raw = st.session_state.import_verses_raw
    if not raw:
        st.session_state.import_step = 1
        return

    translation_id: str = raw.get("translation", "NIV")
    verses_in: list[dict] = raw["verses"]

    if st.session_state.import_previewed is None:
        with st.spinner("Checking against database…"):
            st.session_state.import_previewed = db.preview_import(verses_in, translation_id)

    previewed: list[dict] = st.session_state.import_previewed

    new_count = sum(1 for v in previewed if v["status"] == "NEW")
    upd_count = sum(1 for v in previewed if v["status"] == "UPDATE")
    err_count = sum(1 for v in previewed if v["status"] == "ERROR")

    max_rank = db.get_max_rank()
    start_rank = max_rank + 1
    end_rank = max_rank + new_count

    st.markdown(f"### Preview: {len(previewed)} verses — {new_count} NEW · {upd_count} UPDATES · {err_count} ERR")

    if new_count > 0:
        st.info(
            f"📌 **Drip position:** ranks {start_rank} → {end_rank}  \n"
            "New verses unlock after users have mastered enough prior verses. Released = ON."
        )

    for v in previewed:
        status = v["status"]
        icon = {"NEW": "🆕", "UPDATE": "♻️", "ERROR": "❌"}.get(status, "?")
        with st.expander(
            f"{icon} {_book_name_for_id(v['book_id'])} {v['chapter']}:{v['verse']} [{status}]",
            expanded=(status == "ERROR"),
        ):
            if status == "ERROR":
                st.error(v.get("error", "Unknown error"))
                continue

            st.write(v["text"])
            words = v["text"].split(" ")
            bk = f"import_blanks_{v['book_id']}_{v['chapter']}_{v['verse']}"
            if bk not in st.session_state:
                st.session_state[bk] = list(sorted(v.get("blanks", [])))[:2]

            selected: list[int] = st.session_state[bk]
            for row_start in range(0, len(words), 6):
                row_words = words[row_start : row_start + 6]
                col_widths = [max(len(w), 3) for w in row_words]
                cols = st.columns(col_widths)
                for ci, (col, word) in enumerate(zip(cols, row_words)):
                    gi = row_start + ci
                    is_sel = gi in selected
                    if col.button(word, key=f"imp_{bk}_{gi}", type="primary" if is_sel else "secondary", use_container_width=True):
                        if is_sel:
                            selected.remove(gi)
                        else:
                            if len(selected) >= 2:
                                selected.pop(0)
                            selected.append(gi)
                        st.session_state[bk] = selected
                        v["blanks"] = sorted(selected)

            n = len(selected)
            if n == 2:
                sel_words = [words[i] if i < len(words) else "?" for i in sorted(selected)]
                st.caption(f"✅ {sel_words[0]} · {sel_words[1]}")
            else:
                st.caption(f"⚠️ {n}/2 blanks selected")

    st.divider()
    col_back, col_import = st.columns([1, 2])

    if col_back.button("← Back"):
        st.session_state.import_step = 1
        st.session_state.import_previewed = None
        st.rerun()

    importable = [v for v in previewed if v["status"] != "ERROR"]
    can_import = all(
        len(st.session_state.get(
            f"import_blanks_{v['book_id']}_{v['chapter']}_{v['verse']}",
            v.get("blanks", []),
        )) == 2
        for v in importable
    )

    if col_import.button("✅ Import All", type="primary", disabled=(not importable or not can_import)):
        for v in importable:
            bk = f"import_blanks_{v['book_id']}_{v['chapter']}_{v['verse']}"
            v["blanks"] = sorted(st.session_state.get(bk, v.get("blanks", [])))

        with st.spinner("Importing…"):
            result = db.import_verses(importable, start_rank)

        if result["errors"]:
            for err in result["errors"]:
                st.error(err)

        st.success(f"✅ Done! {result['new']} new · {result['updated']} updated · {len(result['errors'])} errors")

        st.session_state.show_import_modal = False
        st.session_state.import_step = 1
        st.session_state.import_previewed = None
        st.session_state.import_verses_raw = None
        st.cache_data.clear()
        st.rerun()


# ── Main page ─────────────────────────────────────────────────────────────────

def main() -> None:
    # Header
    col_title, col_import_btn = st.columns([5, 1])
    col_title.markdown("## 📖 LearnBible Editor")
    if col_import_btn.button("📥 Import Verses", type="secondary"):
        st.session_state.edit_verse_ref_id = None  # can't have two dialogs open
        st.session_state.show_import_modal = True

    st.markdown("---")

    # ── Row 1: Search text (full width) ──────────────────────────────────────
    text_search = st.text_input(
        "Search text",
        placeholder="Search verse text…",
        label_visibility="collapsed",
        on_change=_close_edit_dialog,
    )

    # ── Row 2: Filters ───────────────────────────────────────────────────────
    translations = load_translations()
    books = load_books()
    trans_options = {t["id"]: f"{t['id']} — {t['name']}" for t in translations}
    book_options = {b["id"]: b["name"] for b in books}
    default_trans = "NIV" if "NIV" in trans_options else (list(trans_options.keys())[0] if trans_options else "NIV")

    col_t, col_b, col_ch, col_v, col_sort = st.columns([2, 2, 1, 1, 2])

    selected_trans = col_t.selectbox(
        "Translation",
        options=list(trans_options.keys()),
        format_func=lambda x: trans_options.get(x, x),
        index=list(trans_options.keys()).index(default_trans) if default_trans in trans_options else 0,
        on_change=_close_edit_dialog,
    )
    selected_book = col_b.selectbox(
        "Book",
        options=[None] + list(book_options.keys()),
        format_func=lambda x: "All books" if x is None else book_options.get(x, str(x)),
        index=0,
        on_change=_close_edit_dialog,
    )
    chapter_input = col_ch.number_input("Chapter", min_value=0, value=0, step=1, help="0 = all chapters", on_change=_close_edit_dialog)
    verse_input = col_v.number_input("Verse", min_value=0, value=0, step=1, help="0 = all verses", on_change=_close_edit_dialog)
    sort_by = col_sort.selectbox("Sort by", ["Book order", "Rank"], on_change=_close_edit_dialog)

    # ── Results ───────────────────────────────────────────────────────────────
    with st.spinner("Loading…"):
        rows = cached_search(
            translation_id=selected_trans,
            book_id=selected_book,
            chapter=int(chapter_input) if chapter_input > 0 else None,
            verse=int(verse_input) if verse_input > 0 else None,
            text_search=text_search,
        )

    if sort_by == "Rank":
        rows.sort(key=lambda x: (x.get("global_rank") is None, x.get("global_rank") or 0))

    if not rows:
        st.info("No verses found.")
    else:
        st.markdown(f"**{len(rows)} verse{'s' if len(rows) != 1 else ''} found**")
        _render_verse_table(rows, selected_trans)

    # ── Dialogs — only one can be open at a time ──────────────────────────────
    if st.session_state.edit_verse_ref_id:
        verse_editor_modal(
            st.session_state.edit_verse_ref_id,
            st.session_state.edit_translation_id,
        )
    elif st.session_state.show_import_modal:
        import_modal()


# ── Verse table ───────────────────────────────────────────────────────────────

def _render_verse_table(rows: list[dict], translation_id: str) -> None:
    # Column ratios — last two are action columns (no header labels)
    COLS = [2, 1, 5, 2, 1, 2, 1, 1]

    # Headers (no wrap, compact)
    h = st.columns(COLS)
    for col, label in zip(h, ["Book", "Ch:V", "Text", "Blanks", "Out", "Rank", "", ""]):
        col.markdown(f'<span class="table-header"><span>{label}</span></span>', unsafe_allow_html=True)

    # Hair-line separator with minimal spacing
    st.markdown('<hr style="margin:2px 0 4px 0; border-color:#2a2f45"/>', unsafe_allow_html=True)

    for row in rows:
        cols = st.columns(COLS)
        released_icon = "✅" if row.get("released") else ("—" if row.get("global_rank") is None else "🔒")

        cols[0].write(row["book_name"])
        cols[1].write(f"{row['chapter']}:{row['verse']}")
        cols[2].write((row["text"][:60] + "…") if len(row["text"]) > 60 else row["text"])
        cols[3].write(_blanks_label(row.get("answer_json")))
        cols[4].write(released_icon)
        cols[5].write(str(row["global_rank"]) if row.get("global_rank") is not None else "—")

        # Edit
        if cols[6].button("✏️", key=f"edit_{row['verse_ref_id']}", help="Edit verse"):
            # Clear stale blank selection so modal re-seeds from DB
            sel_key = f"blanks_{row['verse_ref_id']}"
            if sel_key in st.session_state:
                del st.session_state[sel_key]
            st.session_state.edit_verse_ref_id = row["verse_ref_id"]
            st.session_state.edit_translation_id = translation_id

        # Delete (soft)
        if row.get("question_id"):
            q_id = row["question_id"]
            active_key = f"del_active_{q_id}"
            if active_key not in st.session_state:
                st.session_state[active_key] = False

            if not st.session_state[active_key]:
                if cols[7].button("🗑️", key=f"del_{q_id}", help="Delete question"):
                    st.session_state[active_key] = True
                    st.rerun()
            else:
                with cols[7]:
                    st.warning(f"Delete {row['book_name']} {row['chapter']}:{row['verse']}?")
                    if st.button("Yes", key=f"del_yes_{q_id}", type="primary"):
                        db.soft_delete_question(q_id)
                        st.session_state[active_key] = False
                        st.cache_data.clear()
                        st.rerun()
                    if st.button("No", key=f"del_no_{q_id}"):
                        st.session_state[active_key] = False
                        st.rerun()
        else:
            cols[7].write("—")


def _blanks_label(answer_json: dict | None) -> str:
    if not answer_json:
        return "—"
    answers = answer_json.get("answers", [])
    indices = answer_json.get("word_indices", [])
    if not indices:
        return "—"
    if answers:
        return ", ".join(f'"{w}"' for w in answers)
    return f"{len(indices)} blanks"


# ── Entry point ───────────────────────────────────────────────────────────────

main()
