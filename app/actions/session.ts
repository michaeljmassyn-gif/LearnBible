"use server"

import { createClient } from "@/lib/supabase/server"
import type { GameQuestion, SessionFilters } from "@/types"
import type { BlanksAnswerJson, MatchRefAnswerJson } from "@/lib/bible/types"
import { calcNextDue, calcMastery } from "@/lib/srs"

/**
 * Generate a game session for the current user.
 * Returns up to `count` questions mixing: due reviews, near-due, and new verses.
 * Ratio: 60% due | 30% near-due | 10% new
 */
export async function generateSession(
  filters: SessionFilters,
  count: number = 10
): Promise<{ questions: GameQuestion[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { questions: [], error: "Not authenticated" }

  const dueTarget = Math.floor(count * 0.6)
  const nearDueTarget = Math.floor(count * 0.3)
  const newTarget = count - dueTarget - nearDueTarget
  const now = new Date().toISOString()
  const near = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  // ── Mastery-based pool size ────────────────────────────────
  // Pool = 10 base + 1 per mastered verse (mastery >= 0.7).
  // Only applies to NEW verse introduction — reviews are always shown.
  const { count: masteredCount } = await supabase
    .from("user_verse_state")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("mastery", 0.7)
  const poolSize = 10 + (masteredCount ?? 0)

  // ── Build base question query ──────────────────────────────
  async function queryQuestions(verseRefIds: string[]) {
    if (verseRefIds.length === 0) return []

    const { data } = await supabase
      .from("question")
      .select(`
        id,
        type,
        verse_ref_id,
        translation_id,
        prompt,
        answer_json,
        difficulty,
        verse_ref!inner (
          id,
          chapter,
          verse,
          book!inner ( name, testament )
        ),
        verse_text!inner ( text )
      `)
      .eq("active", true)
      .eq("translation_id", filters.translationId)
      .in("verse_ref_id", verseRefIds)
      .limit(count)

    return data ?? []
  }

  // ── Helper: filter verse_refs by testament/book ───────────
  async function getFilteredVerseRefIds(): Promise<string[]> {
    let query = supabase
      .from("verse_ref")
      .select("id, book!inner(testament)")

    if (filters.testament !== "BOTH") {
      query = query.eq("book.testament", filters.testament)
    }
    if (filters.bookIds && filters.bookIds.length > 0) {
      query = query.in("book_id", filters.bookIds)
    }

    const { data } = await query
    return (data ?? []).map((r) => r.id)
  }

  const allVerseRefIds = await getFilteredVerseRefIds()
  if (allVerseRefIds.length === 0) return { questions: [], error: "No verses match your filters." }

  // ── 1. Due reviews ────────────────────────────────────────
  const { data: dueStates } = await supabase
    .from("user_verse_state")
    .select("verse_ref_id")
    .eq("user_id", user.id)
    .lte("next_due_at", now)
    .in("verse_ref_id", allVerseRefIds)
    .limit(dueTarget)

  const dueRefIds = (dueStates ?? []).map((s) => s.verse_ref_id)

  // ── 2. Near-due ───────────────────────────────────────────
  const alreadyPicked = new Set(dueRefIds)

  const { data: nearStates } = await supabase
    .from("user_verse_state")
    .select("verse_ref_id")
    .eq("user_id", user.id)
    .gt("next_due_at", now)
    .lte("next_due_at", near)
    .in("verse_ref_id", allVerseRefIds)
    .limit(nearDueTarget)

  const nearRefIds = (nearStates ?? [])
    .map((s) => s.verse_ref_id)
    .filter((id) => !alreadyPicked.has(id))

  nearRefIds.forEach((id) => alreadyPicked.add(id))

  // ── 3. New verses (from verse_release, not yet seen) ──────
  // Gated by pool size — only verses within global_rank <= poolSize are accessible.
  // Within the pool, easiest (lowest global_difficulty) introduced first.
  const { data: newReleases } = await supabase
    .from("verse_release")
    .select("verse_ref_id")
    .eq("released", true)
    .in("verse_ref_id", allVerseRefIds)
    .lte("global_rank", poolSize)
    .not(
      "verse_ref_id",
      "in",
      `(select verse_ref_id from user_verse_state where user_id = '${user.id}')`
    )
    .order("global_difficulty", { ascending: true })
    .limit(newTarget)

  const newRefIds = (newReleases ?? [])
    .map((r) => r.verse_ref_id)
    .filter((id) => !alreadyPicked.has(id))

  const allPickedIds = [...dueRefIds, ...nearRefIds, ...newRefIds]

  if (allPickedIds.length === 0) {
    // Nothing due — just return a few random ones
    const shuffled = allVerseRefIds.sort(() => Math.random() - 0.5).slice(0, count)
    const rawQ = await queryQuestions(shuffled)
    return { questions: rawQ.map(toGameQuestion).filter(Boolean) as GameQuestion[] }
  }

  const rawQuestions = await queryQuestions(allPickedIds)
  return { questions: rawQuestions.map(toGameQuestion).filter(Boolean) as GameQuestion[] }
}

/** Record an attempt + update SRS state */
export async function recordAttempt(params: {
  questionId: string
  verseRefId: string
  isCorrect: boolean
  responseTimeMs?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Fetch question difficulty + log attempt in parallel
  const [{ data: questionData }] = await Promise.all([
    supabase
      .from("question")
      .select("difficulty")
      .eq("id", params.questionId)
      .single(),
    supabase.from("attempt").insert({
      user_id: user.id,
      question_id: params.questionId,
      verse_ref_id: params.verseRefId,
      is_correct: params.isCorrect,
      response_time_ms: params.responseTimeMs ?? null,
    }),
  ])

  const difficulty = questionData?.difficulty ?? 500

  // Get current state
  const { data: existing } = await supabase
    .from("user_verse_state")
    .select("mastery, correct_streak, lapse_count")
    .eq("user_id", user.id)
    .eq("verse_ref_id", params.verseRefId)
    .maybeSingle()

  const currentMastery = existing?.mastery ?? 0
  const currentStreak = existing?.correct_streak ?? 0
  const lapseCount = existing?.lapse_count ?? 0

  const newMastery = calcMastery(currentMastery, params.isCorrect)
  const newStreak = params.isCorrect ? currentStreak + 1 : 0
  const newLapses = params.isCorrect ? lapseCount : lapseCount + 1
  const nextDue = calcNextDue(newStreak, params.isCorrect, difficulty)

  await supabase.from("user_verse_state").upsert(
    {
      user_id: user.id,
      verse_ref_id: params.verseRefId,
      mastery: newMastery,
      correct_streak: newStreak,
      lapse_count: newLapses,
      last_seen_at: new Date().toISOString(),
      next_due_at: nextDue.toISOString(),
    },
    { onConflict: "user_id,verse_ref_id" }
  )

  return { error: null }
}

// ── Shape raw DB row into GameQuestion ──────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGameQuestion(row: any): GameQuestion | null {
  if (!row) return null
  const vr = row.verse_ref
  const vt = Array.isArray(row.verse_text) ? row.verse_text[0] : row.verse_text
  if (!vr || !vt) return null

  const bookName = vr.book?.name ?? "Unknown"
  const reference = `${bookName} ${vr.chapter}:${vr.verse}`

  const base: GameQuestion = {
    questionId: row.id,
    verseRefId: row.verse_ref_id,
    type: row.type,
    reference,
    book: bookName,
    chapter: vr.chapter,
    verse: vr.verse,
    translation: row.translation_id,
    text: vt.text,
  }

  if (row.type === "BLANKS") {
    const aj = row.answer_json as BlanksAnswerJson
    return { ...base, wordIndices: aj.word_indices, answers: aj.answers }
  }

  if (row.type === "MATCH_REF") {
    const aj = row.answer_json as MatchRefAnswerJson
    return { ...base, distractors: aj.distractors }
  }

  return base
}
