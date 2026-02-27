import Link from "next/link"
import { Gamepad2, Trophy, Star, Zap } from "lucide-react"
import { getCurrentProfile } from "@/actions/user"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { xpToNextLevel, xpWithinLevel } from "@/lib/xp"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/auth/login")

  const withinLevel = xpWithinLevel(profile.xp, profile.level)
  const toNext = xpToNextLevel(profile.level)
  const pct = Math.min((withinLevel / toNext) * 100, 100)

  return (
    <>
      <TopBar profile={profile} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-black text-foreground">
            Hey, {profile.first_name}! 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {profile.grade} · @{profile.username}
          </p>
        </div>

        {/* XP Card */}
        <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">Level {profile.level}</span>
            </div>
            <span className="text-sm text-muted-foreground font-semibold">
              {withinLevel} / {toNext} XP
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 shadow-[0_0_10px_oklch(0.85_0.18_90/0.5)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {toNext - withinLevel} XP to Level {profile.level + 1}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-1">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-2xl font-black text-foreground">{profile.xp}</span>
            <span className="text-xs text-muted-foreground font-semibold">Total XP</span>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-1">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-2xl font-black text-foreground">Lvl {profile.level}</span>
            <span className="text-xs text-muted-foreground font-semibold">Current Level</span>
          </div>
        </div>

        {/* Play CTA */}
        <Link href="/game" className="block">
          <Button className="w-full h-16 text-lg font-black bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/30 gap-3">
            <Gamepad2 className="w-6 h-6" />
            Play Now
          </Button>
        </Link>

        {/* Leaderboard shortcut */}
        <Link href="/leaderboard" className="block">
          <Button
            variant="outline"
            className="w-full h-12 font-bold border-border text-foreground hover:bg-card rounded-2xl gap-2"
          >
            <Trophy className="w-5 h-5 text-primary" />
            View Leaderboard
          </Button>
        </Link>
      </div>
    </>
  )
}
