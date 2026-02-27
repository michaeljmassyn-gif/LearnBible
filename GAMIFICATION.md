# Gamification Features

All the feedback systems that make the game feel rewarding.

---

## Difficulty modes

Three modes chosen once at the start of each session:

| Mode | What changes | XP multiplier |
|------|-------------|--------------|
| **Easy** | Reference always visible, blanks only | 0.5× |
| **Medium** | Reference hidden; after blanks → pick from 3 options | 1× |
| **Hard** | Reference hidden; after blanks → type it from memory | 1.5× |

Mode is locked for the session. Navigating away resets it so you pick again next time. This prevents switching modes mid-question to exploit the XP multiplier.

---

## Streak system

A streak counts consecutive rounds where **all active phases pass** (blanks correct + reference correct in Medium/Hard).

Any wrong answer — blank or reference — resets the streak to 0.

### Milestone overlays

Fired at streak thresholds with sounds + animations:

| Streak | Milestone | Sound | Extra |
|--------|-----------|-------|-------|
| 3 | ⭐ "3x Streak! Keep it up!" | `playStreak3` | — |
| 5 | 🔥 "5x Streak! You're on fire!" | `playStreak5` | — |
| 10, 15, 20… | 💥 "Nx Streak!! ABSOLUTELY UNREAL!!" | `playStreak10` | Confetti cannon |

The overlay appears as a centred card with a spring-entrance animation. On Medium/Hard the milestone fires after the reference phase resolves, not after the blanks.

### Streak XP bonus

Streaks also boost XP per round — see [XP_LOGIC.md](./XP_LOGIC.md).

---

## Level-up modal

When a round pushes the user to a new level, a modal fires after the server confirms the new XP total. It shows the new level number with a celebration animation. The modal is dismissible.

---

## XP float

A `+N XP` number floats up from the top-right corner after each round. It uses a CSS animation (`xp-float`) and auto-removes after 1.3 seconds.

---

## Confetti

| Trigger | Config |
|---------|--------|
| All blanks correct (Easy, or blank phase in Medium/Hard) | 80 particles, spread 60, origin y=0.6, gold palette |
| Streak milestone at 10+ | 220 particles, spread 120, origin y=0.5, full colour palette |

---

## Sounds

| Function | When |
|----------|------|
| `playCorrect` | Individual blank correct (partial round) |
| `playIncorrect` | Individual blank incorrect |
| `playVerseComplete` | All phases correct, no milestone firing |
| `playStreak3/5/10` | Streak milestone 3 / 5 / 10+ |

---

## Enter-key navigation (mobile)

On mobile, pressing the keyboard's **Next** button on a blank input focuses the next blank instead of submitting. Pressing it on the last blank submits. The `enterKeyHint` attribute is set accordingly (`"next"` / `"done"`) so the keyboard label matches the action.

---

## Pre-game mode picker

Before the first question loads, users see a card-based screen with all three modes, their XP multiplier, and a one-line description of what they test. Medium is marked **Recommended**. Tapping a card locks the mode and starts the game immediately.
