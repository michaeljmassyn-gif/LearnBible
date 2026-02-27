"use server"

import { createClient } from "@/lib/supabase/server"
import type { LeaderboardEntry, Profile } from "@/types"

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("username, level, xp")
    .order("level", { ascending: false })
    .order("xp", { ascending: false })
    .limit(50)

  if (error || !data) return []

  return data.map((row, i) => ({
    username: row.username,
    level: row.level,
    xp: row.xp,
    rank: i + 1,
  }))
}

/** Returns the 1-based rank of a user (how many players are above them + 1) */
export async function getUserRank(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("level, xp")
    .eq("id", userId)
    .single()

  if (!profile) return 0

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .or(
      `level.gt.${profile.level},and(level.eq.${profile.level},xp.gt.${profile.xp})`
    )

  return (count ?? 0) + 1
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !data) return null
  return data as Profile
}
