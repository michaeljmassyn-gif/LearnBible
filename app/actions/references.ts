"use server"

import { createClient } from "@/lib/supabase/server"
import { DEFAULT_TRANSLATION } from "@/types"

const FALLBACKS = ["Genesis 1:1", "Revelation 22:21"]

/**
 * Returns `count` random verse references from the DB, different from `verseRefId`.
 * Only includes verses that have text in DEFAULT_TRANSLATION.
 * Falls back to hardcoded references if the DB has too few verses.
 */
export async function getDistractors(verseRefId: string, count = 2): Promise<string[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("verse_ref")
      .select(`
        id,
        chapter,
        verse,
        book!inner ( name ),
        verse_text ( translation_id )
      `)
      .neq("id", verseRefId)
      .limit(50)

    if (error || !data || data.length === 0) {
      return FALLBACKS.slice(0, count)
    }

    // Filter to only verses that have text in the default translation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valid = data.filter((r: any) => {
      const texts = Array.isArray(r.verse_text) ? r.verse_text : [r.verse_text]
      return texts.some((t: { translation_id: string } | null) => t?.translation_id === DEFAULT_TRANSLATION)
    })

    if (valid.length === 0) return FALLBACKS.slice(0, count)

    // Shuffle and pick
    const shuffled = [...valid].sort(() => Math.random() - 0.5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: string[] = shuffled.slice(0, count).map((r: any) => {
      const bookName = Array.isArray(r.book) ? r.book[0]?.name : r.book?.name
      return `${bookName} ${r.chapter}:${r.verse}`
    })

    // Fill with fallbacks if we got fewer than requested
    let fallbackIdx = 0
    while (results.length < count) {
      const fallback = FALLBACKS[fallbackIdx % FALLBACKS.length]
      if (!results.includes(fallback)) results.push(fallback)
      fallbackIdx++
      if (fallbackIdx > FALLBACKS.length * 2) break // safety
    }

    return results.slice(0, count)
  } catch {
    return FALLBACKS.slice(0, count)
  }
}
