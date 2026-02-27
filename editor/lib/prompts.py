"""LLM prompt and JSON schema for bulk verse import."""

IMPORT_PROMPT = """\
You are helping populate LearnBible, a gamified Duolingo-style Bible learning app for youth.

## Your task
Generate a JSON list of Bible verses for a given topic or passage range. Each verse must include exactly 2 fill-in-the-blank words chosen for theological significance.

## JSON schema

```json
{
  "translation": "NIV",
  "verses": [
    {
      "book_id": <integer 1–66>,
      "chapter": <integer>,
      "verse": <integer>,
      "text": "<exact NIV verse text>",
      "blanks": [<word_index_A>, <word_index_B>]
    }
  ]
}
```

### Field notes
- `book_id` — canonical book number (see table below)
- `text` — exact NIV (2011) text, no verse numbers, no footnote markers
- `blanks` — exactly 2 zero-based word indices (split by spaces). Must be sorted ascending.
  - Choose theologically meaningful, memorable keywords — names of God, key verbs, doctrinal nouns
  - Avoid function words (the, a, and, but, in, of, to, is, are, was)
  - Avoid consecutive indices unless unavoidable

## Book ID reference

| ID | Book        | ID | Book           | ID | Book          |
|----|-------------|----|-----------------|----|---------------|
|  1 | Genesis     | 24 | Jeremiah        | 47 | 2 Corinthians |
|  2 | Exodus      | 25 | Lamentations    | 48 | Galatians     |
|  3 | Leviticus   | 26 | Ezekiel         | 49 | Ephesians     |
|  4 | Numbers     | 27 | Daniel          | 50 | Philippians   |
|  5 | Deuteronomy | 28 | Hosea           | 51 | Colossians    |
|  6 | Joshua      | 29 | Joel            | 52 | 1 Thessalonians |
|  7 | Judges      | 30 | Amos            | 53 | 2 Thessalonians |
|  8 | Ruth        | 31 | Obadiah         | 54 | 1 Timothy     |
|  9 | 1 Samuel    | 32 | Jonah           | 55 | 2 Timothy     |
| 10 | 2 Samuel    | 33 | Micah           | 56 | Titus         |
| 11 | 1 Kings     | 34 | Nahum           | 57 | Philemon      |
| 12 | 2 Kings     | 35 | Habakkuk        | 58 | Hebrews       |
| 13 | 1 Chronicles| 36 | Zephaniah       | 59 | James         |
| 14 | 2 Chronicles| 37 | Haggai          | 60 | 1 Peter       |
| 15 | Ezra        | 38 | Zechariah       | 61 | 2 Peter       |
| 16 | Nehemiah    | 39 | Malachi         | 62 | 1 John        |
| 17 | Esther      | 40 | Matthew         | 63 | 2 John        |
| 18 | Job         | 41 | Mark            | 64 | 3 John        |
| 19 | Psalms      | 42 | Luke            | 65 | Jude          |
| 20 | Proverbs    | 43 | John            | 66 | Revelation    |
| 21 | Ecclesiastes| 44 | Acts            |    |               |
| 22 | Song of Songs| 45 | Romans         |    |               |
| 23 | Isaiah      | 46 | 1 Corinthians   |    |               |

## Rules
1. Use NIV (2011) text exactly. Do not paraphrase or modernise.
2. Choose exactly 2 blanks per verse — no more, no fewer.
3. Blank indices are 0-based, counting from the first word of the verse text (not the verse number).
4. Word splitting: split `text` by single spaces. Punctuation attached to a word is part of that word
   e.g. "God," is one word at its index.
5. Blank indices must be sorted ascending in the array.
6. Pick keywords that reinforce the theological point of the verse.
7. Output only valid JSON — no markdown fences, no commentary, no trailing commas.

## Worked example

Topic: John 3:16

Input text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."

Word list (0-based):
0:For 1:God 2:so 3:loved 4:the 5:world 6:that 7:he 8:gave 9:his 10:one 11:and 12:only 13:Son, 14:that 15:whoever 16:believes 17:in 18:him 19:shall 20:not 21:perish 22:but 23:have 24:eternal 25:life.

Good blanks: [3, 24]  → "loved" (key verb) and "eternal" (key adjective)
Bad blanks:  [4, 6]   → "the" and "that" — function words

Output:
```json
{
  "translation": "NIV",
  "verses": [
    {
      "book_id": 43,
      "chapter": 3,
      "verse": 16,
      "text": "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      "blanks": [3, 24]
    }
  ]
}
```

---

Now generate verses for the following topic/passage:
"""

JSON_SCHEMA = """\
{
  "translation": "NIV",
  "verses": [
    {
      "book_id": 43,
      "chapter": 3,
      "verse": 16,
      "text": "For God so loved the world...",
      "blanks": [3, 13]
    }
  ]
}"""
