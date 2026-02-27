"use client"

import { cn } from "@/lib/utils"
import type { GameMode } from "@/lib/xp"

interface ModeSelectorProps {
  mode: GameMode
  onChange: (mode: GameMode) => void
  disabled?: boolean
}

const MODES: { value: GameMode; label: string; multiplier: string; icon: string }[] = [
  { value: "easy",   label: "Easy",   multiplier: "0.5×", icon: "⚡" },
  { value: "medium", label: "Medium", multiplier: "1×",   icon: "⚡⚡" },
  { value: "hard",   label: "Hard",   multiplier: "1.5×", icon: "⚡⚡⚡" },
]

export function ModeSelector({ mode, onChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex gap-2 justify-center">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => !disabled && onChange(m.value)}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            mode === m.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80",
          )}
        >
          {m.icon} {m.label} {m.multiplier}
        </button>
      ))}
    </div>
  )
}
