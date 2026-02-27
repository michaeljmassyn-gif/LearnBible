"use client"

import { useState } from "react"
import { FillInBlank } from "@/components/game/FillInBlank"
import { TopBar } from "@/components/layout/TopBar"
import type { GameQuestion, Profile } from "@/types"
import type { GameMode } from "@/lib/xp"
import { cn } from "@/lib/utils"

interface GameClientProps {
  initialQuestion: GameQuestion
  initialProfile: Profile
}

const MODE_OPTIONS: {
  value: GameMode
  icon: string
  label: string
  multiplier: string
  description: string
  details: string[]
  recommended?: boolean
  accent: string
  badge: string
}[] = [
  {
    value:       "easy",
    icon:        "⚡",
    label:       "Easy",
    multiplier:  "0.5×",
    description: "Reference always visible",
    details:     ["Type the missing words", "Reference shown throughout"],
    accent:      "border-green-500/40 hover:border-green-500",
    badge:       "bg-green-500/15 text-green-400",
  },
  {
    value:       "medium",
    icon:        "⚡⚡",
    label:       "Medium",
    multiplier:  "1×",
    description: "Type blanks, then pick the reference",
    details:     ["Type the missing words", "Choose from 3 reference options"],
    recommended: true,
    accent:      "border-primary/40 hover:border-primary",
    badge:       "bg-primary/15 text-primary",
  },
  {
    value:       "hard",
    icon:        "⚡⚡⚡",
    label:       "Hard",
    multiplier:  "1.5×",
    description: "Type blanks AND the full reference",
    details:     ["Type the missing words", "Type the reference from memory"],
    accent:      "border-orange-500/40 hover:border-orange-500",
    badge:       "bg-orange-500/15 text-orange-400",
  },
]

export function GameClient({ initialQuestion, initialProfile }: GameClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [streak, setStreak]   = useState(0)
  const [mode, setMode]       = useState<GameMode | null>(null)

  function handleProfileUpdate(updates: { xp: number; level: number }) {
    setProfile((p) => ({ ...p, ...updates }))
  }

  // ── Mode picker (shown once per session, resets on navigation) ──
  if (mode === null) {
    return (
      <>
        <TopBar profile={profile} title="Fill in the Blank" />
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black">Choose Difficulty</h2>
            <p className="text-muted-foreground text-sm">Locked in for the session</p>
          </div>
          <div className="flex flex-col gap-3">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "relative rounded-2xl border-2 bg-card p-5 text-left transition-all",
                  m.accent,
                )}
              >
                {m.recommended && (
                  <span className="absolute top-3 right-3 text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("text-xs font-black px-2 py-1 rounded-full", m.badge)}>
                    {m.icon} {m.multiplier} XP
                  </span>
                  <span className="font-black text-lg">{m.label}</span>
                </div>
                <p className="text-sm font-semibold text-foreground/80 mb-1">{m.description}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {m.details.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar profile={profile} title="Fill in the Blank" />
      <div className="max-w-lg mx-auto px-4 py-6">
        <FillInBlank
          initialQuestion={initialQuestion}
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
          streak={streak}
          onStreakChange={setStreak}
          mode={mode}
        />
      </div>
    </>
  )
}
