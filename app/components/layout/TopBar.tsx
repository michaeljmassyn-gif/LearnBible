import { BookOpen } from "lucide-react"
import { xpWithinLevel, xpToNextLevel } from "@/lib/xp"
import type { Profile } from "@/types"
import { cn } from "@/lib/utils"

interface TopBarProps {
  profile: Profile
  title?: string
}

export function TopBar({ profile, title }: TopBarProps) {
  const withinLevel = xpWithinLevel(profile.xp, profile.level)
  const toNext = xpToNextLevel(profile.level)
  const pct = Math.min((withinLevel / toNext) * 100, 100)

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        {/* Left: logo or title */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-black text-base text-foreground">
            {title ?? "LearnBible"}
          </span>
        </div>

        {/* Right: level + XP bar */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow shadow-primary/30"
          )}>
            Lvl {profile.level}
          </span>
          <div className="w-24 flex flex-col gap-0.5">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_6px_oklch(0.85_0.18_90/0.6)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold text-right">
              {withinLevel}/{toNext} XP
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
