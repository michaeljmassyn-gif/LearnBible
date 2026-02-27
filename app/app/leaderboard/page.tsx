import { Trophy, Medal, BookOpen } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { getLeaderboard, getCurrentProfile, getUserRank } from "@/actions/user"
import { BottomNav } from "@/components/layout/BottomNav"

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [entries, profile] = await Promise.all([
    getLeaderboard(),
    user ? getCurrentProfile() : Promise.resolve(null),
  ])

  // Find user's rank — check if they're in top 50 list first
  const myEntry = profile
    ? entries.find((e) => e.username === profile.username) ?? null
    : null
  const myRank = myEntry
    ? myEntry.rank
    : profile
    ? await getUserRank(profile.id)
    : null

  const inTopList = !!myEntry

  return (
    <div className={cn("min-h-dvh max-w-lg mx-auto px-4 py-6 space-y-6", user && "pb-[calc(6rem+env(safe-area-inset-bottom)]")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-black text-base">LearnBible</span>
        </div>
        {!user && (
          <Link href="/auth/login" className="text-sm text-primary font-bold hover:underline">
            Log In
          </Link>
        )}
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">Top scripture scholars</p>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 items-end pt-2 pb-4">
          {/* 2nd */}
          <PodiumCard entry={entries[1]} myUsername={profile?.username} />

          {/* 1st — tallest */}
          <PodiumCard entry={entries[0]} myUsername={profile?.username} first />

          {/* 3rd */}
          <PodiumCard entry={entries[2]} myUsername={profile?.username} third />
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {entries.map((entry) => {
          const isMe = profile?.username === entry.username
          return (
            <div
              key={entry.username}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 border transition-all",
                isMe
                  ? "bg-primary/15 border-primary/50 shadow-sm shadow-primary/10"
                  : entry.rank === 1
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border"
              )}
            >
              <span className={cn(
                "text-sm font-black w-6 text-center",
                isMe || entry.rank === 1 ? "text-primary" : "text-muted-foreground"
              )}>
                {entry.rank}
              </span>
              <span className={cn(
                "flex-1 font-bold text-sm truncate",
                isMe ? "text-primary" : entry.rank === 1 ? "text-primary" : "text-foreground"
              )}>
                @{entry.username}
                {isMe && <span className="ml-1.5 text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">YOU</span>}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Lvl {entry.level}
              </span>
              <span className={cn("text-xs font-black", isMe ? "text-primary" : "text-primary")}>
                {entry.xp} XP
              </span>
            </div>
          )
        })}

        {entries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-bold">No players yet.</p>
            <p className="text-sm">Be the first to sign up!</p>
          </div>
        )}
      </div>

      {/* User position if outside top 50 */}
      {profile && !inTopList && myRank && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground px-2">
            <div className="flex-1 h-px bg-border" />
            <span>Your position</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 border bg-primary/15 border-primary/50 shadow-sm shadow-primary/10">
            <span className="text-sm font-black w-6 text-center text-primary">{myRank}</span>
            <span className="flex-1 font-bold text-sm text-primary truncate">
              @{profile.username}
              <span className="ml-1.5 text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">YOU</span>
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Lvl {profile.level}</span>
            <span className="text-xs text-primary font-black">{profile.xp} XP</span>
          </div>
        </div>
      )}

      {/* CTA for guests */}
      {!user && (
        <div className="pb-8">
          <Link
            href="/auth/register"
            className="block w-full text-center py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
          >
            Join & Compete
          </Link>
        </div>
      )}

      {/* Bottom nav for signed-in users */}
      {user && <BottomNav />}
    </div>
  )
}

function PodiumCard({
  entry,
  myUsername,
  first,
  third,
}: {
  entry: { username: string; level: number; xp: number; rank: number }
  myUsername?: string
  first?: boolean
  third?: boolean
}) {
  const isMe = myUsername === entry.username
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "rounded-full flex items-center justify-center",
        first
          ? "w-14 h-14 bg-primary/20 shadow-lg shadow-primary/20"
          : "w-12 h-12 bg-muted"
      )}>
        {first ? (
          <Trophy className="w-7 h-7 text-primary" />
        ) : (
          <Medal className={cn("w-6 h-6", third ? "text-amber-700" : "text-slate-400")} />
        )}
      </div>
      <div className={cn(
        "rounded-2xl px-2 py-3 text-center w-full flex flex-col justify-center border",
        first
          ? cn("h-28 shadow-lg shadow-primary/10", isMe ? "bg-primary/20 border-primary/60" : "bg-card border-primary/40")
          : cn(third ? "h-20" : "h-24", isMe ? "bg-primary/15 border-primary/50" : "bg-card border-border")
      )}>
        <p className={cn("font-black text-sm truncate", isMe || first ? "text-primary" : "text-foreground")}>
          {entry.username}
          {isMe && <span className="block text-[9px]">YOU</span>}
        </p>
        <p className="text-xs text-muted-foreground">Lvl {entry.level}</p>
        <p className={cn("font-black", first ? "text-sm text-primary" : "text-xs text-primary")}>
          {entry.xp} XP
        </p>
      </div>
    </div>
  )
}
