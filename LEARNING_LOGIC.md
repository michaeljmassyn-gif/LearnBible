# Learning Logic

How LearnBible decides which verses to show, when to show them again, and whether a user has mastered a verse.

---

## Spaced repetition (SRS)

After every attempt, two values are updated: **mastery** and **next review date**.

### Mastery score

Stored as a float 0 – 1 in `user_verse_state.mastery`.

```
correct  → mastery = min(1,  mastery + 0.1 × (1 − mastery))   ← diminishing returns near 1
incorrect → mastery = max(0, mastery − 0.2)                    ← sharper drop
```

A verse is considered "mastered" at `mastery >= 0.7`. This threshold gates pool expansion (see below).

### Review intervals

Five fixed intervals in days: **1 → 3 → 7 → 14 → 30**

The interval is chosen by the user's `correct_streak` for that verse (0-based index, capped at 4).

A **difficulty factor** stretches or compresses the interval:

```
difficultyFactor = 1.5 − (question.difficulty / 1000)
  difficulty 0    → factor 1.5  (easy verse, reviewed less often)
  difficulty 500  → factor 1.0  (default)
  difficulty 1000 → factor 0.5  (hard verse, reviewed more often)

nextDue = now + interval_days × difficultyFactor × 86400s
```

On an **incorrect** attempt, the verse is due again in 10 minutes regardless of difficulty.

### What counts as "correct"

| Mode | Correct means |
|------|--------------|
| Easy | All blanks correct |
| Medium | All blanks correct **and** correct reference selected |
| Hard | All blanks correct **and** correct reference typed |

Getting the blanks right but failing the reference in Medium/Hard counts as incorrect for SRS purposes — the review interval resets and mastery drops.

---

## Verse pool (drip system)

Users don't see all verses immediately. The pool size is:

```
poolSize = 10 + masteredVerseCount   (mastery >= 0.7)
```

Starting pool: 10 verses. Every verse a user masters unlocks one more slot. Verses are ranked globally by `verse_release.global_rank` and enter the pool in rank order.

Within the pool, new verses are introduced in order of `global_difficulty` (easiest first).

---

## Session composition

When generating a session (`generateSession` in `actions/session.ts`), verses are drawn in this ratio:

| Bucket | Target share | Rule |
|--------|-------------|------|
| Due reviews | 60% | `next_due_at <= now` |
| Near-due | 30% | `next_due_at` within the next 24 hours |
| New verses | 10% | Never seen, within current pool |

If nothing is due, a random selection from the full pool is returned instead.

---

## Key database tables

| Table | Purpose |
|-------|---------|
| `user_verse_state` | Per-user mastery, correct streak, lapse count, next review date |
| `verse_release` | Global verse list with `global_rank` and `global_difficulty` |
| `attempt` | Full audit log of every answer (used for difficulty recalculation) |
| `question` | Game question config, stores `difficulty` (0–1000) |
