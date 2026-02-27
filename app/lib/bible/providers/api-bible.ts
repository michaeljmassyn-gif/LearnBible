import type { BibleProvider, BibleTranslation, BibleVerse } from "../types"

const BASE_URL = "https://rest.api.bible/v1"

function getApiKey(): string {
  const key = process.env.BIBLE_API_KEY
  if (!key) throw new Error("BIBLE_API_KEY is not set in environment variables.")
  return key
}

async function apiBibleFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "api-key": getApiKey() },
    next: { revalidate: 60 * 60 * 24 }, // cache 24h in Next.js fetch cache
  })
  if (!res.ok) {
    throw new Error(`api.bible error ${res.status}: ${path}`)
  }
  const json = await res.json()
  return json.data as T
}

/** Strip HTML tags and collapse whitespace from api.bible content */
function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export class ApiBibleProvider implements BibleProvider {
  readonly providerId = "api_bible"

  async listTranslations(): Promise<BibleTranslation[]> {
    const data = await apiBibleFetch<
      Array<{ id: string; abbreviation: string; name: string; language: { id: string } }>
    >("/bibles?language=eng")

    return data.map((b) => ({
      providerId: b.id,
      abbreviation: b.abbreviation,
      name: b.name,
      languageCode: b.language?.id ?? "eng",
    }))
  }

  async getVerse(params: {
    translationProviderId: string
    bookApiId: string
    chapter: number
    verse: number
  }): Promise<BibleVerse | null> {
    const verseId = `${params.bookApiId}.${params.chapter}.${params.verse}`

    try {
      const data = await apiBibleFetch<{ content: string; reference: string }>(
        `/bibles/${params.translationProviderId}/verses/${verseId}` +
          `?content-type=text` +
          `&include-notes=false` +
          `&include-titles=false` +
          `&include-chapter-numbers=false` +
          `&include-verse-numbers=false` +
          `&include-verse-spans=false`
      )

      return {
        bookApiId: params.bookApiId,
        chapter: params.chapter,
        verse: params.verse,
        text: cleanText(data.content),
      }
    } catch {
      return null
    }
  }

  async getChapter(params: {
    translationProviderId: string
    bookApiId: string
    chapter: number
  }): Promise<BibleVerse[]> {
    const chapterId = `${params.bookApiId}.${params.chapter}`

    const data = await apiBibleFetch<
      Array<{ id: string; content: string }>
    >(
      `/bibles/${params.translationProviderId}/chapters/${chapterId}/verses` +
        `?content-type=text` +
        `&include-notes=false` +
        `&include-titles=false` +
        `&include-chapter-numbers=false` +
        `&include-verse-numbers=false`
    )

    return data.map((v) => {
      // verse id format: "JHN.3.16"
      const parts = v.id.split(".")
      return {
        bookApiId: params.bookApiId,
        chapter: params.chapter,
        verse: parseInt(parts[2] ?? "1"),
        text: cleanText(v.content),
      }
    })
  }
}
