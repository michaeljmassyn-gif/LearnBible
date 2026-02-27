export type { GameMode } from "@/lib/xp"

// ── Database row types ──────────────────────────────────────

export type Profile = {
  id: string
  username: string
  first_name: string
  last_name: string
  grade: string
  level: number
  xp: number
  created_at: string
}

export type Book = {
  id: number
  name: string
  abbr: string
  api_bible_id: string
  testament: "OT" | "NT"
  sort_order: number
}

export type Translation = {
  id: string          // 'KJV'
  name: string        // 'King James Version'
  language_code: string
  provider: string    // 'api_bible' | 'local'
  provider_id: string | null
  license_type: string
  allow_cache: boolean
  active: boolean
}

export type VerseRef = {
  id: string
  book_id: number
  chapter: number
  verse: number
}

export type VerseText = {
  id: string
  verse_ref_id: string
  translation_id: string
  text: string
  fetched_at: string
}

export type Question = {
  id: string
  type: QuestionType
  verse_ref_id: string | null
  translation_id: string | null
  prompt: string | null
  answer_json: Record<string, unknown>
  difficulty: number
  active: boolean
  created_at: string
}

export type QuestionType = "BLANKS" | "MATCH_REF" | "WHO" | "WHERE" | "TIMELINE" | "MCQ"

export type UserVerseState = {
  user_id: string
  verse_ref_id: string
  introduced_at: string
  mastery: number
  correct_streak: number
  lapse_count: number
  last_seen_at: string | null
  next_due_at: string
}

export type Attempt = {
  id: string
  user_id: string
  question_id: string
  verse_ref_id: string | null
  is_correct: boolean
  response_time_ms: number | null
  created_at: string
}

// ── Game types (used by frontend components) ────────────────

/** A question ready for the game UI — all text already resolved */
export type GameQuestion = {
  questionId: string
  verseRefId: string
  type: QuestionType
  reference: string        // "John 3:16"
  book: string             // "John"
  chapter: number
  verse: number
  translation: string      // "KJV"
  text: string             // full verse text
  // BLANKS specific
  wordIndices?: number[]
  answers?: string[]
  // MATCH_REF specific
  distractors?: string[]
}

export type LeaderboardEntry = {
  username: string
  level: number
  xp: number
  rank: number
}

// ── Session filters ─────────────────────────────────────────

export type Testament = "OT" | "NT" | "BOTH"

export type SessionFilters = {
  testament: Testament
  bookIds?: number[]       // empty = all books
  translationId: string    // e.g. 'KJV'
}

// ── Constants ───────────────────────────────────────────────

export const GRADES = [
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
] as const

export type Grade = (typeof GRADES)[number]

export const DEFAULT_TRANSLATION = "NIV"
export const DEFAULT_SESSION_SIZE = 20
