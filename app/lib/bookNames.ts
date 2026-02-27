// Maps lowercase/abbreviated book names to canonical Bible book names
const BOOK_MAP: Record<string, string> = {
  // Genesis
  "genesis": "Genesis", "gen": "Genesis", "ge": "Genesis",
  // Exodus
  "exodus": "Exodus", "exod": "Exodus", "ex": "Exodus",
  // Leviticus
  "leviticus": "Leviticus", "lev": "Leviticus", "le": "Leviticus", "lv": "Leviticus",
  // Numbers
  "numbers": "Numbers", "num": "Numbers", "nu": "Numbers", "nb": "Numbers",
  // Deuteronomy
  "deuteronomy": "Deuteronomy", "deut": "Deuteronomy", "dt": "Deuteronomy",
  // Joshua
  "joshua": "Joshua", "josh": "Joshua", "jos": "Joshua",
  // Judges
  "judges": "Judges", "judg": "Judges", "jdg": "Judges", "jg": "Judges",
  // Ruth
  "ruth": "Ruth", "rth": "Ruth",
  // 1 Samuel
  "1 samuel": "1 Samuel", "1samuel": "1 Samuel", "1 sam": "1 Samuel", "1sam": "1 Samuel",
  "1sa": "1 Samuel", "i sam": "1 Samuel", "i samuel": "1 Samuel",
  // 2 Samuel
  "2 samuel": "2 Samuel", "2samuel": "2 Samuel", "2 sam": "2 Samuel", "2sam": "2 Samuel",
  "2sa": "2 Samuel", "ii sam": "2 Samuel", "ii samuel": "2 Samuel",
  // 1 Kings
  "1 kings": "1 Kings", "1kings": "1 Kings", "1 kgs": "1 Kings", "1kgs": "1 Kings",
  "1ki": "1 Kings", "i kings": "1 Kings", "i kgs": "1 Kings",
  // 2 Kings
  "2 kings": "2 Kings", "2kings": "2 Kings", "2 kgs": "2 Kings", "2kgs": "2 Kings",
  "2ki": "2 Kings", "ii kings": "2 Kings", "ii kgs": "2 Kings",
  // 1 Chronicles
  "1 chronicles": "1 Chronicles", "1chronicles": "1 Chronicles", "1 chron": "1 Chronicles",
  "1chron": "1 Chronicles", "1 chr": "1 Chronicles", "1chr": "1 Chronicles",
  "i chr": "1 Chronicles", "i chron": "1 Chronicles", "i chronicles": "1 Chronicles",
  // 2 Chronicles
  "2 chronicles": "2 Chronicles", "2chronicles": "2 Chronicles", "2 chron": "2 Chronicles",
  "2chron": "2 Chronicles", "2 chr": "2 Chronicles", "2chr": "2 Chronicles",
  "ii chr": "2 Chronicles", "ii chron": "2 Chronicles", "ii chronicles": "2 Chronicles",
  // Ezra
  "ezra": "Ezra", "ezr": "Ezra",
  // Nehemiah
  "nehemiah": "Nehemiah", "neh": "Nehemiah",
  // Esther
  "esther": "Esther", "esth": "Esther", "est": "Esther",
  // Job
  "job": "Job",
  // Psalms
  "psalms": "Psalms", "psalm": "Psalms", "ps": "Psalms", "psa": "Psalms", "pss": "Psalms",
  // Proverbs
  "proverbs": "Proverbs", "prov": "Proverbs", "pro": "Proverbs", "prv": "Proverbs",
  // Ecclesiastes
  "ecclesiastes": "Ecclesiastes", "eccl": "Ecclesiastes", "ecc": "Ecclesiastes",
  "qoh": "Ecclesiastes",
  // Song of Solomon
  "song of solomon": "Song of Solomon", "song": "Song of Solomon",
  "song of songs": "Song of Solomon", "sos": "Song of Solomon",
  "ss": "Song of Solomon", "cant": "Song of Solomon",
  // Isaiah
  "isaiah": "Isaiah", "isa": "Isaiah", "is": "Isaiah",
  // Jeremiah
  "jeremiah": "Jeremiah", "jer": "Jeremiah", "je": "Jeremiah",
  // Lamentations
  "lamentations": "Lamentations", "lam": "Lamentations", "la": "Lamentations",
  // Ezekiel
  "ezekiel": "Ezekiel", "ezek": "Ezekiel", "eze": "Ezekiel",
  // Daniel
  "daniel": "Daniel", "dan": "Daniel", "da": "Daniel",
  // Hosea
  "hosea": "Hosea", "hos": "Hosea",
  // Joel
  "joel": "Joel", "jl": "Joel",
  // Amos
  "amos": "Amos", "am": "Amos",
  // Obadiah
  "obadiah": "Obadiah", "obad": "Obadiah", "ob": "Obadiah",
  // Jonah
  "jonah": "Jonah", "jon": "Jonah",
  // Micah
  "micah": "Micah", "mic": "Micah",
  // Nahum
  "nahum": "Nahum", "nah": "Nahum", "na": "Nahum",
  // Habakkuk
  "habakkuk": "Habakkuk", "hab": "Habakkuk",
  // Zephaniah
  "zephaniah": "Zephaniah", "zeph": "Zephaniah", "zep": "Zephaniah",
  // Haggai
  "haggai": "Haggai", "hag": "Haggai",
  // Zechariah
  "zechariah": "Zechariah", "zech": "Zechariah", "zec": "Zechariah",
  // Malachi
  "malachi": "Malachi", "mal": "Malachi",
  // Matthew
  "matthew": "Matthew", "matt": "Matthew", "mat": "Matthew", "mt": "Matthew",
  // Mark
  "mark": "Mark", "mrk": "Mark", "mk": "Mark",
  // Luke
  "luke": "Luke", "luk": "Luke", "lk": "Luke",
  // John
  "john": "John", "jhn": "John", "jn": "John",
  // Acts
  "acts": "Acts", "act": "Acts", "ac": "Acts",
  // Romans
  "romans": "Romans", "rom": "Romans", "ro": "Romans",
  // 1 Corinthians
  "1 corinthians": "1 Corinthians", "1corinthians": "1 Corinthians",
  "1 cor": "1 Corinthians", "1cor": "1 Corinthians",
  "i cor": "1 Corinthians", "i corinthians": "1 Corinthians",
  // 2 Corinthians
  "2 corinthians": "2 Corinthians", "2corinthians": "2 Corinthians",
  "2 cor": "2 Corinthians", "2cor": "2 Corinthians",
  "ii cor": "2 Corinthians", "ii corinthians": "2 Corinthians",
  // Galatians
  "galatians": "Galatians", "gal": "Galatians", "ga": "Galatians",
  // Ephesians
  "ephesians": "Ephesians", "eph": "Ephesians",
  // Philippians
  "philippians": "Philippians", "phil": "Philippians", "php": "Philippians",
  // Colossians
  "colossians": "Colossians", "col": "Colossians",
  // 1 Thessalonians
  "1 thessalonians": "1 Thessalonians", "1thessalonians": "1 Thessalonians",
  "1 thess": "1 Thessalonians", "1thess": "1 Thessalonians",
  "1 th": "1 Thessalonians", "1th": "1 Thessalonians",
  "i thess": "1 Thessalonians", "i thessalonians": "1 Thessalonians",
  // 2 Thessalonians
  "2 thessalonians": "2 Thessalonians", "2thessalonians": "2 Thessalonians",
  "2 thess": "2 Thessalonians", "2thess": "2 Thessalonians",
  "2 th": "2 Thessalonians", "2th": "2 Thessalonians",
  "ii thess": "2 Thessalonians", "ii thessalonians": "2 Thessalonians",
  // 1 Timothy
  "1 timothy": "1 Timothy", "1timothy": "1 Timothy",
  "1 tim": "1 Timothy", "1tim": "1 Timothy", "1ti": "1 Timothy",
  "i tim": "1 Timothy", "i timothy": "1 Timothy",
  // 2 Timothy
  "2 timothy": "2 Timothy", "2timothy": "2 Timothy",
  "2 tim": "2 Timothy", "2tim": "2 Timothy", "2ti": "2 Timothy",
  "ii tim": "2 Timothy", "ii timothy": "2 Timothy",
  // Titus
  "titus": "Titus", "tit": "Titus",
  // Philemon
  "philemon": "Philemon", "phlm": "Philemon", "phm": "Philemon",
  // Hebrews
  "hebrews": "Hebrews", "heb": "Hebrews",
  // James
  "james": "James", "jas": "James", "jm": "James",
  // 1 Peter
  "1 peter": "1 Peter", "1peter": "1 Peter", "1 pet": "1 Peter", "1pet": "1 Peter",
  "1pe": "1 Peter", "i pet": "1 Peter", "i peter": "1 Peter",
  // 2 Peter
  "2 peter": "2 Peter", "2peter": "2 Peter", "2 pet": "2 Peter", "2pet": "2 Peter",
  "2pe": "2 Peter", "ii pet": "2 Peter", "ii peter": "2 Peter",
  // 1 John
  "1 john": "1 John", "1john": "1 John", "1 jn": "1 John", "1jn": "1 John",
  "1jo": "1 John", "i john": "1 John", "i jn": "1 John",
  // 2 John
  "2 john": "2 John", "2john": "2 John", "2 jn": "2 John", "2jn": "2 John",
  "2jo": "2 John", "ii john": "2 John", "ii jn": "2 John",
  // 3 John
  "3 john": "3 John", "3john": "3 John", "3 jn": "3 John", "3jn": "3 John",
  "3jo": "3 John", "iii john": "3 John", "iii jn": "3 John",
  // Jude
  "jude": "Jude", "jud": "Jude",
  // Revelation
  "revelation": "Revelation", "rev": "Revelation", "re": "Revelation",
  "apocalypse": "Revelation",
}

/** Maps a raw book name (any case/abbreviation) to the canonical Bible book name, or null if unrecognised. */
export function normalizeBookName(raw: string): string | null {
  return BOOK_MAP[raw.trim().toLowerCase()] ?? null
}

/**
 * Parses a Bible reference string like "John 3:16", "1 Cor 13:13", "Psalm 23:1".
 * Returns null for unrecognised formats or book names.
 */
export function parseReference(
  input: string,
): { book: string; chapter: number; verse: number } | null {
  if (!input) return null

  // Match: <optional-text> <chapter>:<verse> at end of string
  const match = input.trim().match(/^(.*?)\s+(\d+):(\d+)$/)
  if (!match) return null

  const bookRaw = match[1].trim()
  const chapter = parseInt(match[2], 10)
  const verse   = parseInt(match[3], 10)

  if (isNaN(chapter) || isNaN(verse)) return null

  const book = normalizeBookName(bookRaw)
  if (!book) return null

  return { book, chapter, verse }
}
