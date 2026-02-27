import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/actions/user"
import { TopBar } from "@/components/layout/TopBar"
import { GameSelectionClient } from "./GameSelectionClient"

export default async function GameSelectionPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/auth/login")

  return (
    <>
      <TopBar profile={profile} title="Choose a Game" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div>
          <h2 className="text-xl font-black text-foreground">Game Modes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Tap a card to play, tap ? to learn more</p>
        </div>
        <GameSelectionClient userLevel={profile.level} />
      </div>
    </>
  )
}
