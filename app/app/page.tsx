import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BookOpen, Trophy, Zap, Star } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect("/dashboard")

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto px-4">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-12">
        <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
          <BookOpen className="w-12 h-12 text-primary-foreground" />
        </div>

        <div>
          <h1 className="text-5xl font-black text-foreground leading-tight">
            Learn<span className="text-primary">Bible</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed max-w-xs mx-auto">
            Compete. Level up. Master scripture.{" "}
            <br />
            Duolingo energy, but for God&apos;s Word.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { icon: Zap, text: "Earn XP" },
            { icon: Star, text: "Level Up" },
            { icon: Trophy, text: "Compete" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm font-bold text-foreground"
            >
              <Icon className="w-4 h-4 text-primary" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="pb-12 space-y-3">
        <Link
          href="/auth/register"
          className="block w-full text-center py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/30 hover:bg-primary/90 transition-colors"
        >
          Get Started — It&apos;s Free
        </Link>
        <Link
          href="/auth/login"
          className="block w-full text-center py-4 rounded-2xl bg-card border border-border text-foreground font-bold text-base hover:bg-secondary transition-colors"
        >
          Log In
        </Link>
        <Link
          href="/leaderboard"
          className="block w-full text-center py-3 text-primary font-bold text-sm hover:underline"
        >
          View Leaderboard →
        </Link>
      </div>
    </div>
  )
}
