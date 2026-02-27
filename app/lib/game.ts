export type WordToken =
  | { type: "word"; text: string; index: number }
  | { type: "blank"; wordIndex: number; answer: string }

/**
 * Checks a user answer against the expected answer.
 * Case-insensitive, whitespace-trimmed, punctuation-stripped.
 */
export function checkAnswer(userInput: string, expected: string): boolean {
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z0-9']/g, "")
  return normalize(userInput) === normalize(expected)
}

/**
 * Returns the display width hint for a blank input based on answer length.
 * Minimum 5 chars wide so tiny words are still tappable.
 */
export function blankWidth(answer: string): number {
  return Math.max(answer.length, 5)
}
