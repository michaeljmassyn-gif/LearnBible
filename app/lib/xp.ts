export const XP_CORRECT = 10
export const XP_INCORRECT = 2
export const XP_STREAK_BONUS = 5   // per-verse "all correct" bonus

// ── Streak bonuses (stacks on top of XP_STREAK_BONUS) ───────
export function streakXpBonus(streak: number): number {
  if (streak >= 10) return 25
  if (streak >= 5)  return 15
  if (streak >= 3)  return 5
  return 0
}

export type StreakMilestone = "cute" | "cool" | "crazy"

/** Returns milestone type at exactly streak 3, 5, 10, 15, 20... else null */
export function getStreakMilestone(streak: number): StreakMilestone | null {
  if (streak === 3) return "cute"
  if (streak === 5) return "cool"
  if (streak >= 10 && (streak === 10 || (streak - 10) % 5 === 0)) return "crazy"
  return null
}

/** Total XP required to reach a given level */
export function xpForLevel(level: number): number {
  return 50 * level * level
}

/** XP required to go from current level to next */
export function xpToNextLevel(level: number): number {
  return xpForLevel(level + 1) - xpForLevel(level)
}

/** XP earned within the current level (for progress bar) */
export function xpWithinLevel(totalXp: number, level: number): number {
  return totalXp - xpForLevel(level)
}

/** Progress 0–1 within current level */
export function levelProgress(totalXp: number, level: number): number {
  const earned = xpWithinLevel(totalXp, level)
  const needed = xpToNextLevel(level)
  return Math.min(earned / needed, 1)
}

/**
 * Given current xp + xp to add, returns new xp and new level.
 * Handles multi-level jumps.
 */
export function applyXP(
  currentXp: number,
  currentLevel: number,
  xpGained: number
): { newXp: number; newLevel: number; leveledUp: boolean } {
  let xp = currentXp + xpGained
  let level = currentLevel
  let leveledUp = false

  while (xp >= xpForLevel(level + 1)) {
    level++
    leveledUp = true
  }

  return { newXp: xp, newLevel: level, leveledUp }
}

// ── Difficulty modes ─────────────────────────────────────────

export type GameMode = "easy" | "medium" | "hard"

export const MODE_MULTIPLIERS: Record<GameMode, number> = {
  easy:   0.5,
  medium: 1.0,
  hard:   1.5,
}

export const XP_REFERENCE_CORRECT = 15
