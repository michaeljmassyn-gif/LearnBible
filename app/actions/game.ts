"use server"

import { createClient } from "@/lib/supabase/server"
import { applyXP, XP_CORRECT, XP_INCORRECT, XP_STREAK_BONUS, XP_REFERENCE_CORRECT, streakXpBonus, MODE_MULTIPLIERS } from "@/lib/xp"
import type { GameMode } from "@/lib/xp"
import { recordAttempt } from "@/actions/session"
import type { GameQuestion, SessionFilters } from "@/types"
import type { BlanksAnswerJson } from "@/lib/bible/types"
import { DEFAULT_TRANSLATION } from "@/types"

/** Fetch a single random question for the game, respecting filters */
export async function getRandomQuestion(
  filters: Partial<SessionFilters> = {},
  excludeQuestionId?: string
): Promise<{ question: GameQuestion | null; error?: string }> {
  const supabase = await createClient()
  const translationId = filters.translationId ?? DEFAULT_TRANSLATION

  // ── Mastery-based pool gate ───────────────────────────────
  // Pool = 10 base verses + 1 per mastered verse (mastery >= 0.7)
  // Fetch user + mastered count + all released verse ranks in parallel
  const { data: { user } } = await supabase.auth.getUser()
  const [{ count: masteredCount }, { data: released }] = await Promise.all([
    user
      ? supabase
          .from("user_verse_state")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("mastery", 0.7)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("verse_release")
      .select("verse_ref_id, global_rank")
      .eq("released", true)
      .order("global_rank", { ascending: true }),
  ])
  const poolSize = 10 + (masteredCount ?? 0)
  const poolVerseRefIds = (released ?? [])
    .filter((r) => r.global_rank <= poolSize)
    .map((r) => r.verse_ref_id)

  if (poolVerseRefIds.length === 0) {
    return { question: null, error: "No verses in pool yet." }
  }

  let query = supabase
    .from("question")
    .select(`
      id,
      type,
      verse_ref_id,
      translation_id,
      answer_json,
      difficulty,
      verse_ref!inner (
        id,
        chapter,
        verse,
        book!inner ( id, name, testament ),
        verse_text ( text, translation_id )
      )
    `)
    .eq("active", true)
    .eq("translation_id", translationId)
    .eq("type", "BLANKS")
    .in("verse_ref_id", poolVerseRefIds)

  if (excludeQuestionId) query = query.neq("id", excludeQuestionId)

  if (filters.testament && filters.testament !== "BOTH") {
    query = query.eq("verse_ref.book.testament", filters.testament)
  }
  if (filters.bookIds && filters.bookIds.length > 0) {
    query = query.in("verse_ref.book_id", filters.bookIds)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return { question: null, error: "No questions found. Make sure the database is seeded." }
  }

  // Pick random from results
  const row = data[Math.floor(Math.random() * data.length)]

  return { question: rowToGameQuestion(row) }
}

/**
 * Submit a completed round.
 * Awards XP, updates level, records attempt + SRS state.
 */
export async function submitRound(params: {
  questionId: string
  verseRefId: string
  correctCount: number
  incorrectCount: number
  allCorrect: boolean
  responseTimeMs?: number
  streak?: number       // consecutive correct questions BEFORE this answer
  mode?: GameMode       // difficulty mode; defaults to "medium"
  refCorrect?: boolean  // undefined = Easy (no reference phase)
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) return { error: "Profile not found" }

  // Physically impossible to read + type both blanks in under 1.5s.
  // Silently award zero XP — cheater gets no indication they were flagged.
  const suspicious =
    typeof params.responseTimeMs === "number" && params.responseTimeMs < 1500

  let xpGained = 0
  let newXp = profile.xp
  let newLevel = profile.level
  let leveledUp = false

  if (!suspicious) {
    const mode = params.mode ?? "medium"
    const blank_xp =
      params.correctCount * XP_CORRECT +
      params.incorrectCount * XP_INCORRECT +
      (params.allCorrect ? XP_STREAK_BONUS : 0) +
      streakXpBonus(params.streak ?? 0)
    const ref_xp = (mode !== "easy" && params.refCorrect === true) ? XP_REFERENCE_CORRECT : 0
    xpGained = Math.round((blank_xp + ref_xp) * MODE_MULTIPLIERS[mode])

    const applied = applyXP(profile.xp, profile.level, xpGained)
    newXp = applied.newXp
    newLevel = applied.newLevel
    leveledUp = applied.leveledUp

    await supabase
      .from("profiles")
      .update({ xp: newXp, level: newLevel })
      .eq("id", user.id)
  }

  // Always record attempt for SRS + audit trail (cron job will exclude
  // fast attempts from difficulty calc via response_time_ms filter)
  // For Medium/Hard both phases must pass; Easy has no reference phase
  const fullCorrect =
    params.allCorrect &&
    (params.mode === "easy" || params.mode === undefined || params.refCorrect === true)

  await recordAttempt({
    questionId: params.questionId,
    verseRefId: params.verseRefId,
    isCorrect: fullCorrect,
    responseTimeMs: params.responseTimeMs,
  })

  return { xpGained, newXp, newLevel, leveledUp, error: null }
}

// ── Helper ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGameQuestion(row: any): GameQuestion | null {
  if (!row) return null
  const vr = row.verse_ref
  if (!vr) return null
  const texts: any[] = Array.isArray(vr.verse_text) ? vr.verse_text : [vr.verse_text]
  const vt = texts.find((t) => t?.translation_id === row.translation_id) ?? texts[0]
  if (!vt) return null

  const bookName = vr.book?.name ?? "Unknown"
  const aj = row.answer_json as BlanksAnswerJson

  return {
    questionId: row.id,
    verseRefId: row.verse_ref_id,
    type: "BLANKS",
    reference: `${bookName} ${vr.chapter}:${vr.verse}`,
    book: bookName,
    chapter: vr.chapter,
    verse: vr.verse,
    translation: row.translation_id,
    text: vt.text,
    wordIndices: aj.word_indices,
    answers: aj.answers,
  }
}
