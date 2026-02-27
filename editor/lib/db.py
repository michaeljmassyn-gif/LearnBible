"""Supabase data layer for the LearnBible admin editor."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from supabase import create_client, Client

# Load credentials from the app's .env.local (two levels up from this file)
load_dotenv(Path(__file__).parents[2] / "app" / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


@lru_cache(maxsize=1)
def _client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise EnvironmentError(
            "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
            "in app/.env.local"
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Reference data ────────────────────────────────────────────────────────────

def get_translations() -> list[dict]:
    """Return all active translations."""
    res = _client().table("translation").select("id, name").eq("active", True).execute()
    return res.data or []


def get_books() -> list[dict]:
    """Return all 66 books ordered canonically."""
    res = (
        _client()
        .table("book")
        .select("id, name, abbr, testament, sort_order")
        .order("sort_order")
        .execute()
    )
    return res.data or []


# ── Verse browser ─────────────────────────────────────────────────────────────

def search_verses(
    translation_id: str,
    book_id: int | None,
    chapter: int | None,
    verse: int | None,
    text_search: str,
    limit: int = 200,
) -> list[dict]:
    """
    Return verses matching the filters.

    Each row contains:
      verse_ref_id, book_name, chapter, verse, text,
      question_id, answer_json, active (question),
      global_rank, released, global_difficulty
    """
    # Build the query using PostgREST embedded resource syntax via supabase-py
    q = (
        _client()
        .table("verse_text")
        .select(
            "id, text, "
            "verse_ref!inner(id, chapter, verse, "
            "  book!inner(id, name, sort_order), "
            "  verse_release(global_rank, released, global_difficulty), "
            "  question(id, answer_json, active, type)"
            ")"
        )
        .eq("translation_id", translation_id)
        .limit(limit)
    )

    if book_id is not None:
        q = q.eq("verse_ref.book_id", book_id)
    if chapter is not None:
        q = q.eq("verse_ref.chapter", chapter)
    if verse is not None:
        q = q.eq("verse_ref.verse", verse)
    if text_search:
        q = q.ilike("text", f"%{text_search}%")

    res = q.execute()
    rows = res.data or []

    # Flatten the nested structure for display
    result = []
    for r in rows:
        vr = r.get("verse_ref", {})
        book = vr.get("book", {})
        release = vr.get("verse_release") or {}
        questions = vr.get("question", [])
        # Find active BLANKS question for this translation
        blanks_q = next(
            (q for q in questions if q.get("type") == "BLANKS" and q.get("active")),
            None,
        )

        result.append(
            {
                "verse_text_id": r["id"],
                "verse_ref_id": vr.get("id"),
                "book_id": book.get("id"),
                "book_name": book.get("name", ""),
                "sort_order": book.get("sort_order", 0),
                "chapter": vr.get("chapter"),
                "verse": vr.get("verse"),
                "text": r.get("text", ""),
                "question_id": blanks_q["id"] if blanks_q else None,
                "answer_json": blanks_q["answer_json"] if blanks_q else None,
                "global_rank": release.get("global_rank"),
                "released": release.get("released"),
                "global_difficulty": release.get("global_difficulty"),
            }
        )

    # Sort client-side by sort_order → chapter → verse (PostgREST nested ordering is limited)
    result.sort(key=lambda x: (x["sort_order"], x["chapter"] or 0, x["verse"] or 0))
    return result


# ── Verse detail ──────────────────────────────────────────────────────────────

def get_verse_detail(verse_ref_id: str, translation_id: str) -> dict | None:
    """Return full detail for the editor modal."""
    res = (
        _client()
        .table("verse_text")
        .select(
            "id, text, "
            "verse_ref!inner(id, chapter, verse, book_id, "
            "  book!inner(id, name, sort_order), "
            "  verse_release(global_rank, released, global_difficulty), "
            "  question(id, answer_json, active, type, difficulty)"
            ")"
        )
        .eq("verse_ref_id", verse_ref_id)
        .eq("translation_id", translation_id)
        .single()
        .execute()
    )
    if not res.data:
        return None

    r = res.data
    vr = r["verse_ref"]
    book = vr["book"]
    release = vr.get("verse_release") or {}
    questions = vr.get("question", [])
    blanks_q = next(
        (q for q in questions if q.get("type") == "BLANKS" and q.get("active")),
        None,
    )

    return {
        "verse_text_id": r["id"],
        "verse_ref_id": vr["id"],
        "book_id": book["id"],
        "book_name": book["name"],
        "translation_id": translation_id,
        "chapter": vr["chapter"],
        "verse": vr["verse"],
        "text": r["text"],
        "global_rank": release.get("global_rank"),
        "released": release.get("released", False),
        "global_difficulty": release.get("global_difficulty"),
        "question_id": blanks_q["id"] if blanks_q else None,
        "answer_json": blanks_q["answer_json"] if blanks_q else None,
        "question_difficulty": blanks_q["difficulty"] if blanks_q else None,
    }


# ── Save verse + release ──────────────────────────────────────────────────────

def save_verse(
    verse_ref_id: str,
    chapter: int,
    verse: int,
    verse_text_id: str,
    text: str,
    rank: int | None,
    released: bool,
) -> None:
    """Update verse_ref, verse_text, and upsert verse_release."""
    db = _client()

    db.table("verse_ref").update({"chapter": chapter, "verse": verse}).eq(
        "id", verse_ref_id
    ).execute()

    db.table("verse_text").update({"text": text}).eq("id", verse_text_id).execute()

    if rank is not None:
        db.table("verse_release").upsert(
            {
                "verse_ref_id": verse_ref_id,
                "global_rank": rank,
                "released": released,
            }
        ).execute()


# ── Questions ─────────────────────────────────────────────────────────────────

def save_question(
    verse_ref_id: str,
    translation_id: str,
    word_indices: list[int],
    text: str,
    question_id: str | None = None,
) -> None:
    """Upsert a BLANKS question. Derives answers by splitting text on spaces."""
    words = text.split(" ")
    sorted_indices = sorted(word_indices)
    answers = [words[i] for i in sorted_indices if i < len(words)]

    payload: dict[str, Any] = {
        "type": "BLANKS",
        "verse_ref_id": verse_ref_id,
        "translation_id": translation_id,
        "answer_json": {"word_indices": sorted_indices, "answers": answers},
        "active": True,
    }

    db = _client()
    if question_id:
        db.table("question").update(
            {"answer_json": payload["answer_json"], "active": True}
        ).eq("id", question_id).execute()
    else:
        # upsert on the unique key (type, verse_ref_id, translation_id)
        db.table("question").upsert(payload, on_conflict="type,verse_ref_id,translation_id").execute()


def soft_delete_question(question_id: str) -> None:
    """Soft-delete a question by setting active=false."""
    _client().table("question").update({"active": False}).eq("id", question_id).execute()


# ── Drip / import ─────────────────────────────────────────────────────────────

def get_max_rank() -> int:
    """Return the current maximum global_rank (0 if table is empty)."""
    res = _client().table("verse_release").select("global_rank").order("global_rank", desc=True).limit(1).execute()
    if res.data:
        return res.data[0]["global_rank"]
    return 0


def import_verses(verses: list[dict], start_rank: int) -> dict:
    """
    Batch-import verses.

    Each verse dict:
      book_id, chapter, verse, text, blanks (list[int]), translation_id

    Returns: {"new": int, "updated": int, "errors": list[str]}
    """
    db = _client()
    new_count = 0
    updated_count = 0
    errors: list[str] = []

    for i, v in enumerate(verses):
        try:
            book_id = v["book_id"]
            chapter = v["chapter"]
            verse_num = v["verse"]
            text = v["text"]
            blanks = sorted(v["blanks"])
            translation_id = v.get("translation_id", "NIV")

            # 1. Upsert verse_ref
            vr_res = (
                db.table("verse_ref")
                .upsert(
                    {"book_id": book_id, "chapter": chapter, "verse": verse_num},
                    on_conflict="book_id,chapter,verse",
                )
                .execute()
            )
            verse_ref_id = vr_res.data[0]["id"]

            # 2. Upsert verse_text
            db.table("verse_text").upsert(
                {
                    "verse_ref_id": verse_ref_id,
                    "translation_id": translation_id,
                    "text": text,
                },
                on_conflict="verse_ref_id,translation_id",
            ).execute()

            # 3. Check if question already exists
            existing_q = (
                db.table("question")
                .select("id")
                .eq("type", "BLANKS")
                .eq("verse_ref_id", verse_ref_id)
                .eq("translation_id", translation_id)
                .execute()
            )
            is_update = bool(existing_q.data)

            # 4. Upsert question
            words = text.split(" ")
            answers = [words[idx] for idx in blanks if idx < len(words)]
            db.table("question").upsert(
                {
                    "type": "BLANKS",
                    "verse_ref_id": verse_ref_id,
                    "translation_id": translation_id,
                    "answer_json": {"word_indices": blanks, "answers": answers},
                    "active": True,
                },
                on_conflict="type,verse_ref_id,translation_id",
            ).execute()

            # 5. Upsert verse_release (only for new verses; don't overwrite existing rank)
            if not is_update:
                rank = start_rank + new_count
                db.table("verse_release").upsert(
                    {
                        "verse_ref_id": verse_ref_id,
                        "global_rank": rank,
                        "released": True,
                    },
                    on_conflict="verse_ref_id",
                ).execute()
                new_count += 1
            else:
                updated_count += 1

        except Exception as exc:
            errors.append(f"Verse {i + 1}: {exc}")

    return {"new": new_count, "updated": updated_count, "errors": errors}


def preview_import(verses: list[dict], translation_id: str = "NIV") -> list[dict]:
    """
    Classify each verse as NEW or UPDATE without writing to DB.

    Returns list of dicts with: book_id, chapter, verse, text, blanks,
    status ('NEW'|'UPDATE'|'ERROR'), error (str|None), verse_ref_id (str|None)
    """
    db = _client()
    result = []

    for v in verses:
        try:
            existing = (
                db.table("verse_ref")
                .select("id, question(id, type, active)")
                .eq("book_id", v["book_id"])
                .eq("chapter", v["chapter"])
                .eq("verse", v["verse"])
                .execute()
            )
            if existing.data:
                vr = existing.data[0]
                blanks_q = next(
                    (q for q in (vr.get("question") or []) if q.get("type") == "BLANKS" and q.get("active")),
                    None,
                )
                status = "UPDATE" if blanks_q else "NEW"
                verse_ref_id = vr["id"]
            else:
                status = "NEW"
                verse_ref_id = None

            result.append({**v, "translation_id": translation_id, "status": status, "verse_ref_id": verse_ref_id, "error": None})
        except Exception as exc:
            result.append({**v, "translation_id": translation_id, "status": "ERROR", "verse_ref_id": None, "error": str(exc)})

    return result
