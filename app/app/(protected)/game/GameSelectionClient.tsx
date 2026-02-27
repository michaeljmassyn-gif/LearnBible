"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  BookOpen,
  Users,
  MapPin,
  Clock,
  Grid2X2,
  Lock,
  Play,
  HelpCircle,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

type GameDef = {
  id: string
  name: string
  shortDesc: string
  longDesc: string
  icon: React.ElementType
  unlockLevel: number
  href: string
  previewLines: string[]
}

const GAMES: GameDef[] = [
  {
    id: "fill-in-the-blank",
    name: "Fill in the Blank",
    shortDesc: "Complete the missing words",
    longDesc:
      "A verse is shown with key words removed. Type the missing words from memory. Earn +10 XP per correct blank, +5 bonus if you get them all!",
    icon: BookOpen,
    unlockLevel: 1,
    href: "/game/fill-in-the-blank",
    previewLines: [
      '"For God so ___ the world…"',
      '"Trust in the ___ with all…"',
    ],
  },
  {
    id: "who-in-the-bible",
    name: "Who in the Bible?",
    shortDesc: "Name the person from the clue",
    longDesc:
      "Read a scenario or quote and identify the Biblical figure it refers to. Tests your knowledge of characters across the Old and New Testaments.",
    icon: Users,
    unlockLevel: 5,
    href: "/game/who-in-the-bible",
    previewLines: ['"He parted the Red Sea…"', '"She hid the spies on her roof…"'],
  },
  {
    id: "where-in-the-bible",
    name: "Where in the Bible?",
    shortDesc: "Find the book & chapter",
    longDesc:
      "Given a verse or event, identify where in the Bible it appears. Builds your navigation skills and helps you locate scripture quickly.",
    icon: MapPin,
    unlockLevel: 8,
    href: "/game/where-in-the-bible",
    previewLines: ['"The Sermon on the Mount"', '"David and Goliath"'],
  },
  {
    id: "timeline",
    name: "Timeline",
    shortDesc: "Order Biblical events",
    longDesc:
      "Put key events from the Bible in the correct chronological order. Great for understanding the big picture of God's story.",
    icon: Clock,
    unlockLevel: 10,
    href: "/game/timeline",
    previewLines: ['"Creation → Fall → Flood"', '"Exile → Return → Jesus"'],
  },
  {
    id: "memory-match",
    name: "Memory Match",
    shortDesc: "Match verses to references",
    longDesc:
      "Flip cards to match verse snippets with their book and chapter references. Tests both memory and scripture familiarity.",
    icon: Grid2X2,
    unlockLevel: 15,
    href: "/game/memory-match",
    previewLines: ['"John 3:16 ↔ For God so loved…"', '"Psalm 23:1 ↔ The Lord is…"'],
  },
]

export function GameSelectionClient({ userLevel }: { userLevel: number }) {
  const router = useRouter()
  const [openInfo, setOpenInfo] = useState<string | null>(null)

  const activeGame = GAMES.find((g) => g.id === openInfo)

  return (
    <>
      {/* Info drawer/modal */}
      {activeGame && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6"
          onClick={() => setOpenInfo(null)}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <activeGame.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-lg leading-tight">
                    {activeGame.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Unlocks at Level {activeGame.unlockLevel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenInfo(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              {activeGame.longDesc}
            </p>

            {/* Preview examples */}
            <div className="rounded-xl bg-muted/50 p-3 space-y-1.5">
              {activeGame.previewLines.map((line, i) => (
                <p key={i} className="text-xs text-muted-foreground font-medium italic">
                  {line}
                </p>
              ))}
            </div>

            {userLevel >= activeGame.unlockLevel ? (
              <button
                onClick={() => router.push(activeGame.href)}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                <Play className="w-5 h-5" /> Play Now
              </button>
            ) : (
              <div className="w-full h-12 rounded-2xl bg-muted flex items-center justify-center gap-2 text-muted-foreground font-bold text-sm">
                <Lock className="w-4 h-4" />
                Reach Level {activeGame.unlockLevel} to unlock
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Game cards */}
      <div className="space-y-3">
        {GAMES.map((game, i) => {
          const unlocked = userLevel >= game.unlockLevel
          const Icon = game.icon

          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "relative rounded-2xl border p-4 flex items-center gap-4 transition-all active:scale-[0.98]",
                unlocked
                  ? "bg-card border-border cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                  : "bg-card/60 border-border/50 cursor-pointer opacity-70"
              )}
              onClick={() => {
                if (unlocked) router.push(game.href)
                else setOpenInfo(game.id)
              }}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                  unlocked ? "bg-primary/15" : "bg-muted"
                )}
              >
                {unlocked ? (
                  <Icon className="w-7 h-7 text-primary" />
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn("font-black text-base", unlocked ? "text-foreground" : "text-muted-foreground")}>
                  {game.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{game.shortDesc}</p>
                {!unlocked && (
                  <p className="text-xs text-primary/70 font-bold mt-1">
                    🔒 Level {game.unlockLevel}
                  </p>
                )}
              </div>

              {/* Info button */}
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenInfo(game.id)
                }}
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Play arrow for unlocked */}
              {unlocked && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow shadow-primary/30">
                  <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </>
  )
}
