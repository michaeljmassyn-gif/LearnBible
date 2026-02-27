// ── Provider interface types ────────────────────────────────

export interface BibleTranslation {
  providerId: string   // api.bible bibleId, e.g. "de4e12af7f28f599-01"
  abbreviation: string // "KJV"
  name: string         // "King James Version"
  languageCode: string // "en"
}

export interface BibleVerse {
  bookApiId: string  // "JHN"
  chapter: number
  verse: number
  text: string       // clean plain text, no markup
}

/** Abstract interface — implement per provider */
export interface BibleProvider {
  readonly providerId: string

  /** List all available translations for this provider */
  listTranslations(): Promise<BibleTranslation[]>

  /** Fetch a single verse. Returns null if not found. */
  getVerse(params: {
    translationProviderId: string
    bookApiId: string
    chapter: number
    verse: number
  }): Promise<BibleVerse | null>

  /** Fetch all verses in a chapter */
  getChapter(params: {
    translationProviderId: string
    bookApiId: string
    chapter: number
  }): Promise<BibleVerse[]>
}

// ── Question answer_json shapes ─────────────────────────────

/** BLANKS — fill-in-the-blank question */
export interface BlanksAnswerJson {
  /** Word indices (0-based) that are blanked */
  word_indices: number[]
  /** Accepted answers per blank (same order as word_indices) */
  answers: string[]
  /** Whether partial credit is given (default true) */
  partial_credit?: boolean
}

/** MATCH_REF — match verse text to its reference */
export interface MatchRefAnswerJson {
  book: string
  chapter: number
  verse: number
  /** Wrong reference choices shown alongside the correct one */
  distractors: string[]  // e.g. ["Romans 8:28", "Psalm 23:1"]
}

/** WHO — identify the biblical figure */
export interface WhoAnswerJson {
  answer: string
  distractors: string[]
}

export type QuestionAnswerJson =
  | BlanksAnswerJson
  | MatchRefAnswerJson
  | WhoAnswerJson
