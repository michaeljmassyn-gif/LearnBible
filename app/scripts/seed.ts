/**
 * LearnBible Seed Script
 * ─────────────────────
 * Run after applying supabase/schema.sql:
 *
 *   npx tsx scripts/seed.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   ← use service_role key for seeding
 *   BIBLE_API_KEY=...                   ← from scripture.api.bible
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Use service_role key for seeding (bypasses RLS) — never expose this in app code
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BIBLE_API_KEY = process.env.BIBLE_API_KEY!
const API_BASE = "https://rest.api.bible/v1"

// ── BOOKS DATA ──────────────────────────────────────────────
const BOOKS = [
  { id: 1,  name: "Genesis",         abbr: "Gen",   api: "GEN",  t: "OT" },
  { id: 2,  name: "Exodus",          abbr: "Exod",  api: "EXO",  t: "OT" },
  { id: 3,  name: "Leviticus",       abbr: "Lev",   api: "LEV",  t: "OT" },
  { id: 4,  name: "Numbers",         abbr: "Num",   api: "NUM",  t: "OT" },
  { id: 5,  name: "Deuteronomy",     abbr: "Deut",  api: "DEU",  t: "OT" },
  { id: 6,  name: "Joshua",          abbr: "Josh",  api: "JOS",  t: "OT" },
  { id: 7,  name: "Judges",          abbr: "Judg",  api: "JDG",  t: "OT" },
  { id: 8,  name: "Ruth",            abbr: "Ruth",  api: "RUT",  t: "OT" },
  { id: 9,  name: "1 Samuel",        abbr: "1Sam",  api: "1SA",  t: "OT" },
  { id: 10, name: "2 Samuel",        abbr: "2Sam",  api: "2SA",  t: "OT" },
  { id: 11, name: "1 Kings",         abbr: "1Kgs",  api: "1KI",  t: "OT" },
  { id: 12, name: "2 Kings",         abbr: "2Kgs",  api: "2KI",  t: "OT" },
  { id: 13, name: "1 Chronicles",    abbr: "1Chr",  api: "1CH",  t: "OT" },
  { id: 14, name: "2 Chronicles",    abbr: "2Chr",  api: "2CH",  t: "OT" },
  { id: 15, name: "Ezra",            abbr: "Ezra",  api: "EZR",  t: "OT" },
  { id: 16, name: "Nehemiah",        abbr: "Neh",   api: "NEH",  t: "OT" },
  { id: 17, name: "Esther",          abbr: "Esth",  api: "EST",  t: "OT" },
  { id: 18, name: "Job",             abbr: "Job",   api: "JOB",  t: "OT" },
  { id: 19, name: "Psalms",          abbr: "Ps",    api: "PSA",  t: "OT" },
  { id: 20, name: "Proverbs",        abbr: "Prov",  api: "PRO",  t: "OT" },
  { id: 21, name: "Ecclesiastes",    abbr: "Eccl",  api: "ECC",  t: "OT" },
  { id: 22, name: "Song of Solomon", abbr: "Song",  api: "SNG",  t: "OT" },
  { id: 23, name: "Isaiah",          abbr: "Isa",   api: "ISA",  t: "OT" },
  { id: 24, name: "Jeremiah",        abbr: "Jer",   api: "JER",  t: "OT" },
  { id: 25, name: "Lamentations",    abbr: "Lam",   api: "LAM",  t: "OT" },
  { id: 26, name: "Ezekiel",         abbr: "Ezek",  api: "EZK",  t: "OT" },
  { id: 27, name: "Daniel",          abbr: "Dan",   api: "DAN",  t: "OT" },
  { id: 28, name: "Hosea",           abbr: "Hos",   api: "HOS",  t: "OT" },
  { id: 29, name: "Joel",            abbr: "Joel",  api: "JOL",  t: "OT" },
  { id: 30, name: "Amos",            abbr: "Amos",  api: "AMO",  t: "OT" },
  { id: 31, name: "Obadiah",         abbr: "Obad",  api: "OBA",  t: "OT" },
  { id: 32, name: "Jonah",           abbr: "Jonah", api: "JON",  t: "OT" },
  { id: 33, name: "Micah",           abbr: "Mic",   api: "MIC",  t: "OT" },
  { id: 34, name: "Nahum",           abbr: "Nah",   api: "NAM",  t: "OT" },
  { id: 35, name: "Habakkuk",        abbr: "Hab",   api: "HAB",  t: "OT" },
  { id: 36, name: "Zephaniah",       abbr: "Zeph",  api: "ZEP",  t: "OT" },
  { id: 37, name: "Haggai",          abbr: "Hag",   api: "HAG",  t: "OT" },
  { id: 38, name: "Zechariah",       abbr: "Zech",  api: "ZEC",  t: "OT" },
  { id: 39, name: "Malachi",         abbr: "Mal",   api: "MAL",  t: "OT" },
  { id: 40, name: "Matthew",         abbr: "Matt",  api: "MAT",  t: "NT" },
  { id: 41, name: "Mark",            abbr: "Mark",  api: "MRK",  t: "NT" },
  { id: 42, name: "Luke",            abbr: "Luke",  api: "LUK",  t: "NT" },
  { id: 43, name: "John",            abbr: "John",  api: "JHN",  t: "NT" },
  { id: 44, name: "Acts",            abbr: "Acts",  api: "ACT",  t: "NT" },
  { id: 45, name: "Romans",          abbr: "Rom",   api: "ROM",  t: "NT" },
  { id: 46, name: "1 Corinthians",   abbr: "1Cor",  api: "1CO",  t: "NT" },
  { id: 47, name: "2 Corinthians",   abbr: "2Cor",  api: "2CO",  t: "NT" },
  { id: 48, name: "Galatians",       abbr: "Gal",   api: "GAL",  t: "NT" },
  { id: 49, name: "Ephesians",       abbr: "Eph",   api: "EPH",  t: "NT" },
  { id: 50, name: "Philippians",     abbr: "Phil",  api: "PHP",  t: "NT" },
  { id: 51, name: "Colossians",      abbr: "Col",   api: "COL",  t: "NT" },
  { id: 52, name: "1 Thessalonians", abbr: "1Thes", api: "1TH",  t: "NT" },
  { id: 53, name: "2 Thessalonians", abbr: "2Thes", api: "2TH",  t: "NT" },
  { id: 54, name: "1 Timothy",       abbr: "1Tim",  api: "1TI",  t: "NT" },
  { id: 55, name: "2 Timothy",       abbr: "2Tim",  api: "2TI",  t: "NT" },
  { id: 56, name: "Titus",           abbr: "Titus", api: "TIT",  t: "NT" },
  { id: 57, name: "Philemon",        abbr: "Phlm",  api: "PHM",  t: "NT" },
  { id: 58, name: "Hebrews",         abbr: "Heb",   api: "HEB",  t: "NT" },
  { id: 59, name: "James",           abbr: "Jas",   api: "JAS",  t: "NT" },
  { id: 60, name: "1 Peter",         abbr: "1Pet",  api: "1PE",  t: "NT" },
  { id: 61, name: "2 Peter",         abbr: "2Pet",  api: "2PE",  t: "NT" },
  { id: 62, name: "1 John",          abbr: "1John", api: "1JN",  t: "NT" },
  { id: 63, name: "2 John",          abbr: "2John", api: "2JN",  t: "NT" },
  { id: 64, name: "3 John",          abbr: "3John", api: "3JN",  t: "NT" },
  { id: 65, name: "Jude",            abbr: "Jude",  api: "JUD",  t: "NT" },
  { id: 66, name: "Revelation",      abbr: "Rev",   api: "REV",  t: "NT" },
]

// ── SEED VERSES + blank definitions ─────────────────────────
// Format: { bookId, chapter, verse, wordIndices }
// wordIndices = 0-based positions of words to blank in the verse text
const SEED_VERSES = [
  { bookId: 43, chapter: 3,   verse: 16,  wordIndices: [3, 10] },   // John 3:16 — loved, gave
  { bookId: 19, chapter: 23,  verse: 1,   wordIndices: [4, 6]  },   // Psalm 23:1 — shepherd, lack
  { bookId: 20, chapter: 3,   verse: 5,   wordIndices: [0, 9]  },   // Prov 3:5 — Trust, lean
  { bookId: 45, chapter: 8,   verse: 28,  wordIndices: [2, 11] },   // Rom 8:28 — know, love
  { bookId: 50, chapter: 4,   verse: 13,  wordIndices: [2, 8]  },   // Phil 4:13 — all, strength
  { bookId: 24, chapter: 29,  verse: 11,  wordIndices: [2, 13] },   // Jer 29:11 — know, prosper
  { bookId: 6,  chapter: 1,   verse: 9,   wordIndices: [5, 7]  },   // Josh 1:9 — strong, courageous
  { bookId: 23, chapter: 40,  verse: 31,  wordIndices: [4, 8]  },   // Isa 40:31 — hope, renew
  { bookId: 40, chapter: 5,   verse: 16,  wordIndices: [5, 17] },   // Matt 5:16 — light, glorify
  { bookId: 19, chapter: 46,  verse: 1,   wordIndices: [3, 5]  },   // Ps 46:1 — refuge, strength
  { bookId: 48, chapter: 5,   verse: 22,  wordIndices: [6, 8]  },   // Gal 5:22 — love, peace
  { bookId: 45, chapter: 6,   verse: 23,  wordIndices: [4, 9]  },   // Rom 6:23 — sin, gift
  { bookId: 55, chapter: 3,   verse: 16,  wordIndices: [2, 7]  },   // 2 Tim 3:16 — breathed, teaching
  { bookId: 43, chapter: 14,  verse: 6,   wordIndices: [4, 8]  },   // John 14:6 — way, life
  { bookId: 49, chapter: 2,   verse: 8,   wordIndices: [4, 9]  },   // Eph 2:8 — grace, faith
  { bookId: 19, chapter: 119, verse: 105, wordIndices: [4, 9]  },   // Ps 119:105 — lamp, light
  { bookId: 40, chapter: 28,  verse: 19,  wordIndices: [3, 6]  },   // Matt 28:19 — disciples, nations
  { bookId: 46, chapter: 13,  verse: 13,  wordIndices: [5, 8]  },   // 1 Cor 13:13 — faith, love
  { bookId: 33, chapter: 6,   verse: 8,   wordIndices: [15, 19]},   // Micah 6:8 — justly, mercy
  { bookId: 5,  chapter: 6,   verse: 5,   wordIndices: [0, 8]  },   // Deut 6:5 — Love, heart
]

function cleanText(raw: string): string {
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

async function fetchVerse(bibleId: string, bookApi: string, chapter: number, verse: number): Promise<string | null> {
  const verseId = `${bookApi}.${chapter}.${verse}`
  const url =
    `${API_BASE}/bibles/${bibleId}/verses/${verseId}` +
    `?content-type=text&include-notes=false&include-titles=false` +
    `&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`

  const res = await fetch(url, { headers: { "api-key": BIBLE_API_KEY } })
  if (!res.ok) {
    console.warn(`  ⚠ Could not fetch ${bookApi}.${chapter}.${verse}: ${res.status}`)
    return null
  }
  const json = await res.json()
  return cleanText(json.data?.content ?? "")
}

async function listBibles(): Promise<void> {
  const res = await fetch(`${API_BASE}/bibles?language=eng`, {
    headers: { "api-key": BIBLE_API_KEY },
  })
  if (!res.ok) throw new Error(`Failed to list bibles: ${res.status}`)
  const json = await res.json()
  console.log("\n📖 Available English bibles on your API key:\n")
  for (const b of json.data ?? []) {
    console.log(`  ${b.abbreviation?.padEnd(12)} ${b.id}  ${b.name}`)
  }
  console.log()
}

async function findNivBibleId(): Promise<string> {
  console.log("🔍 Finding NIV translation ID from api.bible...")
  const res = await fetch(`${API_BASE}/bibles?language=eng`, {
    headers: { "api-key": BIBLE_API_KEY },
  })
  if (!res.ok) throw new Error(`Failed to list bibles: ${res.status}. Check your BIBLE_API_KEY.`)
  const json = await res.json()
  const niv = json.data?.find(
    (b: { abbreviation: string; name: string }) =>
      b.abbreviation?.toUpperCase().includes("NIV") ||
      b.name?.toUpperCase().includes("NEW INTERNATIONAL")
  )
  if (!niv) {
    console.log("  ↩ NIV not found by name, using known ID 78a9f6124f344018-01")
    return "78a9f6124f344018-01"
  }
  console.log(`  ✓ Found: ${niv.abbreviation} — ${niv.id} (${niv.name})`)
  return niv.id
}

async function main() {
  console.log("🌱 LearnBible Seed Script\n")

  if (!BIBLE_API_KEY) {
    console.error("❌ BIBLE_API_KEY is not set in .env.local")
    console.error("   Get a free key at https://scripture.api.bible")
    process.exit(1)
  }

  if (process.argv.includes("--list")) {
    await listBibles()
    process.exit(0)
  }

  // ── 1. Seed books ──────────────────────────────────────────
  console.log("📚 Seeding 66 books...")
  const { error: booksError } = await supabase.from("book").upsert(
    BOOKS.map((b) => ({
      id: b.id,
      name: b.name,
      abbr: b.abbr,
      api_bible_id: b.api,
      testament: b.t,
      sort_order: b.id,
    })),
    { onConflict: "id" }
  )
  if (booksError) { console.error("❌ Books error:", booksError.message); process.exit(1) }
  console.log("  ✓ 66 books seeded\n")

  // ── 2. Seed translation ────────────────────────────────────
  console.log("🌐 Setting up NIV translation...")
  const nivBibleId = await findNivBibleId()

  const { error: transError } = await supabase.from("translation").upsert(
    {
      id: "NIV",
      name: "New International Version",
      language_code: "en",
      provider: "api_bible",
      provider_id: nivBibleId,
      license_type: "standard",
      allow_cache: true,
      active: true,
    },
    { onConflict: "id" }
  )
  if (transError) { console.error("❌ Translation error:", transError.message); process.exit(1) }
  console.log("  ✓ NIV translation seeded\n")

  // ── 3. Seed verses + questions ─────────────────────────────
  console.log(`📖 Seeding ${SEED_VERSES.length} verses from api.bible (NIV)...`)

  const bookMap = new Map(BOOKS.map((b) => [b.id, b]))
  let verseCount = 0
  let questionCount = 0

  for (let i = 0; i < SEED_VERSES.length; i++) {
    const sv = SEED_VERSES[i]
    const book = bookMap.get(sv.bookId)!

    process.stdout.write(`  [${i + 1}/${SEED_VERSES.length}] ${book.name} ${sv.chapter}:${sv.verse} — `)

    // 3a. Upsert verse_ref
    const { data: refData, error: refError } = await supabase
      .from("verse_ref")
      .upsert(
        { book_id: sv.bookId, chapter: sv.chapter, verse: sv.verse },
        { onConflict: "book_id,chapter,verse" }
      )
      .select("id")
      .single()

    if (refError || !refData) {
      console.log(`❌ verse_ref error: ${refError?.message}`)
      continue
    }

    const verseRefId = refData.id

    // 3b. Fetch verse text from api.bible
    const text = await fetchVerse(nivBibleId, book.api, sv.chapter, sv.verse)
    if (!text) {
      console.log("⚠ skipped (no text)")
      continue
    }

    // 3c. Cache verse_text
    await supabase.from("verse_text").upsert(
      { verse_ref_id: verseRefId, translation_id: "NIV", text },
      { onConflict: "verse_ref_id,translation_id" }
    )

    // 3d. Derive answers from the actual fetched text
    const words = text.split(" ")
    const answers = sv.wordIndices
      .filter((idx) => idx < words.length)
      .map((idx) => words[idx].replace(/[^a-zA-Z0-9']/g, ""))

    const validIndices = sv.wordIndices.filter((idx) => idx < words.length)

    // 3e. Upsert question (BLANKS type)
    const { error: qError } = await supabase.from("question").upsert(
      {
        type: "BLANKS",
        verse_ref_id: verseRefId,
        translation_id: "NIV",
        difficulty: 500,
        active: true,
        answer_json: {
          word_indices: validIndices,
          answers,
          partial_credit: true,
        },
      },
      { onConflict: "type,verse_ref_id,translation_id" }
    ).select()

    if (qError) {
      console.log(`⚠ question upsert warning: ${qError.message}`)
    }

    // 3f. Upsert verse_release (global_rank = seed order)
    await supabase.from("verse_release").upsert(
      {
        verse_ref_id: verseRefId,
        global_rank: i + 1,
        global_difficulty: 500,
        released: true,
      },
      { onConflict: "verse_ref_id" }
    )

    verseCount++
    questionCount++
    console.log(`✓ "${text.substring(0, 40)}..."`)

    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 200))
  }

  // ── 4. Seed initial tags ───────────────────────────────────
  console.log("\n🏷  Seeding starter tags...")
  const TAGS = [
    { name: "Faith",      tag_type: "theme", description: "Verses about faith and belief" },
    { name: "Love",       tag_type: "theme", description: "God's love and love for others" },
    { name: "Prayer",     tag_type: "theme", description: "Prayer and communication with God" },
    { name: "Strength",   tag_type: "theme", description: "Finding strength in God" },
    { name: "Salvation",  tag_type: "theme", description: "Salvation and eternal life" },
    { name: "Wisdom",     tag_type: "theme", description: "Wisdom and discernment" },
    { name: "Anxiety",    tag_type: "theme", description: "Peace over fear and worry" },
    { name: "Identity",   tag_type: "theme", description: "Identity in Christ" },
    { name: "Most Loved", tag_type: "pack",  description: "Classic starter pack of well-known verses" },
  ]

  await supabase.from("tag").upsert(TAGS, { onConflict: "name,tag_type" })
  console.log(`  ✓ ${TAGS.length} tags seeded`)

  console.log(`\n✅ Seed complete!`)
  console.log(`   📖 ${verseCount} verses cached`)
  console.log(`   ❓ ${questionCount} questions created`)
  console.log(`\n   Run 'npm run dev' and you're good to go!`)
}

main().catch((e) => { console.error(e); process.exit(1) })
