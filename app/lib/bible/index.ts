import { ApiBibleProvider } from "./providers/api-bible"
import type { BibleProvider } from "./types"

export * from "./types"

/** The default provider used across the app */
export const bibleProvider: BibleProvider = new ApiBibleProvider()

/**
 * Fetch verse text — first checks DB cache, falls back to provider.
 * Call this from server actions only.
 */
export async function getVerseText(params: {
  supabase: ReturnType<typeof import("@/lib/supabase/server").createClient> extends Promise<infer T> ? T : never
  verseRefId: string
  translationId: string
  translationProviderId: string
  bookApiId: string
  chapter: number
  verse: number
}): Promise<string | null> {
  const { supabase, verseRefId, translationId, translationProviderId, bookApiId, chapter, verse } = params

  // 1. Check cache in DB
  const { data: cached } = await supabase
    .from("verse_text")
    .select("text")
    .eq("verse_ref_id", verseRefId)
    .eq("translation_id", translationId)
    .maybeSingle()

  if (cached?.text) return cached.text

  // 2. Fetch from provider
  const result = await bibleProvider.getVerse({
    translationProviderId,
    bookApiId,
    chapter,
    verse,
  })

  if (!result) return null

  // 3. Cache in DB
  await supabase
    .from("verse_text")
    .upsert(
      { verse_ref_id: verseRefId, translation_id: translationId, text: result.text },
      { onConflict: "verse_ref_id,translation_id" }
    )

  return result.text
}
