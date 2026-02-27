import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/actions/user"
import { getRandomQuestion } from "@/actions/game"
import { TopBar } from "@/components/layout/TopBar"
import { GameClient } from "./GameClient"

export default async function FillInBlankPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/auth/login")

  const { question, error } = await getRandomQuestion()

  if (!question || error) {
    return (
      <>
        <TopBar profile={profile} title="Play" />
        <div className="max-w-lg mx-auto px-4 py-12 text-center text-muted-foreground">
          <p className="text-lg font-bold">No verses available right now.</p>
          <p className="text-sm mt-2">The database may need seeding — check the setup guide.</p>
        </div>
      </>
    )
  }

  return <GameClient initialQuestion={question} initialProfile={profile} />
}
