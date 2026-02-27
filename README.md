# LearnBible

A gamified Bible-learning web app built for youth. Users fill in missing words from memorised verses, earn XP, build streaks, and level up — with a spaced-repetition engine scheduling reviews so harder verses come back sooner.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database / Auth | Supabase (Postgres + Row-Level Security) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Deployment | Vercel |

## Getting started

```bash
cd app
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev
```

### Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Database setup

1. Run the migrations in `supabase/migrations/` via the Supabase dashboard or CLI.
2. Seed the question bank: `npx tsx scripts/seed.ts` (or the relevant seed script).

## Project structure

```
app/
├── app/                  # Next.js routes (App Router)
│   └── (protected)/game/ # Game pages (server components)
├── actions/              # Server actions (game, auth, session, references)
├── components/
│   └── game/             # FillInBlank, LevelUpModal, ModeSelector
├── lib/                  # Pure logic (xp.ts, srs.ts, game.ts, bookNames.ts)
├── types/                # Shared TypeScript types
└── supabase/             # Supabase client helpers
```

## Documentation

| File | What it covers |
|------|---------------|
| [LEARNING_LOGIC.md](./LEARNING_LOGIC.md) | Spaced repetition, mastery scoring, session composition |
| [QUESTION_ADDING.md](./QUESTION_ADDING.md) | How to add verses and questions to the database |
| [XP_LOGIC.md](./XP_LOGIC.md) | XP formula, level curve, difficulty multipliers |
| [GAMIFICATION.md](./GAMIFICATION.md) | Streaks, milestones, sound effects, difficulty modes |
