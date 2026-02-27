# XP Logic

How experience points are calculated, how levels work, and how difficulty modes affect earnings. ✨

---

## Per-round XP formula

```
blank_xp  = (correctBlanks × 10) + (incorrectBlanks × 2) + (allCorrect ? 5 : 0) + streakBonus
ref_xp    = refCorrect ? 15 : 0          (always 0 on Easy — no reference phase)
total_xp  = round((blank_xp + ref_xp) × modeMultiplier)
```

### Constants (`lib/xp.ts`)

| Constant | Value | When earned |
|----------|-------|-------------|
| `XP_CORRECT` | 10 | Per correct blank |
| `XP_INCORRECT` | 2 | Per incorrect blank (partial credit) |
| `XP_STREAK_BONUS` | 5 | Flat bonus when all blanks are correct |
| `XP_REFERENCE_CORRECT` | 15 | Reference answered correctly (Medium / Hard) |

---

## Difficulty mode multipliers

| Mode | Multiplier | Reference tested |
|------|-----------|-----------------|
| Easy | 0.5× | No |
| Medium | 1.0× | Yes — multiple choice (3 options) |
| Hard | 1.5× | Yes — type it from memory |

Mode is chosen once per session at the pre-game picker screen and cannot be changed mid-session.

---

## Streak XP bonus

Applied on top of the flat `XP_STREAK_BONUS` when all blanks are correct:

| Streak | Extra XP |
|--------|---------|
| 1 – 2 | +0 |
| 3 – 4 | +5 |
| 5 – 9 | +15 |
| 10+ | +25 |

Streak increments **after all phases pass** — on Medium/Hard, a wrong reference resets it to zero even if the blanks were perfect.

---

## Level curve

```
xpRequiredForLevel(n) = 50 × n²

Level 1  →    50 XP
Level 2  →   200 XP
Level 5  →  1 250 XP
Level 10 →  5 000 XP
```

Progress within a level = `(currentXp − xpForLevel) / (xpForNextLevel − xpForLevel)`.

Multi-level jumps are handled correctly — if a single round pushes past two level thresholds, `level` increments accordingly and the level-up modal fires.

---

## Cheating guard

If a round is submitted in under **1 500 ms** from verse load, XP is silently zeroed. The SRS attempt is still recorded (so the audit trail stays clean). The player receives no indication they were flagged.

This applies to the **blank phase** timing only — the reference phase is not separately timed.
