# Adding Questions

How to add new verses and game questions to LearnBible.

---

## Database schema (relevant tables)

```
book
 └── verse_ref          (the reference identity — translation-independent)
      ├── verse_text     (cached verse text, one row per translation)
      ├── question       (game question for that verse)
      ├── verse_release  (controls when users see it + difficulty ranking)
      └── verse_tag      (thematic tags: "Faith", "Love", etc.)
```

---

## Step-by-step: adding a verse + question

### 1. Ensure the book row exists

`book` rows are seeded once. Check the table — all 66 books should already be there.

### 2. Insert a `verse_ref`

```sql
INSERT INTO verse_ref (book_id, chapter, verse)
VALUES (<book_id>, <chapter>, <verse>)
RETURNING id;
```

`book_id` matches the `book.id` for the relevant book.

### 3. Insert `verse_text`

Text is fetched from api.bible and cached. You can insert it manually for testing:

```sql
INSERT INTO verse_text (verse_ref_id, translation_id, text)
VALUES ('<verse_ref_id>', 'NIV', 'For God so loved the world...');
```

`translation_id` must match an active row in the `translation` table (default: `NIV`).

### 4. Insert a `question`

```sql
INSERT INTO question (type, verse_ref_id, translation_id, answer_json, difficulty, active)
VALUES (
  'BLANKS',
  '<verse_ref_id>',
  'NIV',
  '{"word_indices": [3, 5, 9], "answers": ["loved", "world", "eternal"]}',
  500,    -- 0 (easy) to 1000 (hard)
  true
);
```

#### `answer_json` format for `BLANKS`

```json
{
  "word_indices": [3, 5, 9],
  "answers":      ["loved", "world", "eternal"]
}
```

- `word_indices` — 0-based positions in the verse text split by spaces
- `answers` — the correct words at those positions (same order)

### 5. Insert a `verse_release`

```sql
INSERT INTO verse_release (verse_ref_id, released, global_rank, global_difficulty)
VALUES ('<verse_ref_id>', true, <rank>, <difficulty_0_to_1000>);
```

- `global_rank` — determines the order verses enter the user pool. Lower rank = introduced sooner.
- `global_difficulty` — within the pool, new verses are introduced easiest-first.
- `released = false` hides a verse entirely (useful for staging new content).

---

## Finding word indices

Split the verse text by spaces and count from 0:

```
"For God so loved the world that he gave his one and only Son"
  0    1   2    3      4    5     6    7   8    9   10  11  12  13   14
```

Blanking words 3, 5, 9 → "loved", "world", "gave".

---

## Translation support

Currently the app runs on **NIV** (`DEFAULT_TRANSLATION` in `types/index.ts`). To support another translation, add a row to the `translation` table and ensure `verse_text` rows exist for it. The game query filters by `translation_id` so both must be present.

---

## Seeding in bulk

Scripts live in `app/scripts/`. Check there for any existing bulk-import tooling before inserting rows manually.
