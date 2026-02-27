const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30]

/**
 * Calculate next review date based on correct streak and difficulty.
 *
 * difficulty (0–1000): higher = harder
 *   → hard verses get shorter intervals (reviewed more often)
 *   → easy verses get longer intervals (reviewed less often)
 *
 * difficultyFactor range: 0.5 (hardest) → 1.5 (easiest)
 */
export function calcNextDue(
  correctStreak: number,
  isCorrect: boolean,
  difficulty: number = 500
): Date {
  if (!isCorrect) {
    return new Date(Date.now() + 10 * 60 * 1000)
  }
  const days = SRS_INTERVALS_DAYS[Math.min(correctStreak, SRS_INTERVALS_DAYS.length - 1)]
  const difficultyFactor = 1.5 - difficulty / 1000   // 500→1.0, 1000→0.5, 0→1.5
  return new Date(Date.now() + days * difficultyFactor * 24 * 60 * 60 * 1000)
}

/** Update mastery score (0..1) after an attempt */
export function calcMastery(current: number, isCorrect: boolean): number {
  if (isCorrect) return Math.min(1, current + 0.1 * (1 - current))
  return Math.max(0, current - 0.2)
}
