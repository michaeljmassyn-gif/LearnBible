"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkAnswer, blankWidth } from "@/lib/game"
import { submitRound, getRandomQuestion } from "@/actions/game"
import { getDistractors } from "@/actions/references"
import { parseReference } from "@/lib/bookNames"
import {
  playCorrect,
  playIncorrect,
  playVerseComplete,
  playStreak3,
  playStreak5,
  playStreak10,
} from "@/lib/sounds"
import { LevelUpModal } from "./LevelUpModal"
import {
  XP_CORRECT,
  XP_INCORRECT,
  XP_STREAK_BONUS,
  XP_REFERENCE_CORRECT,
  streakXpBonus,
  getStreakMilestone,
  MODE_MULTIPLIERS,
} from "@/lib/xp"
import type { StreakMilestone, GameMode } from "@/lib/xp"
import type { GameQuestion, Profile, SessionFilters } from "@/types"
import { cn } from "@/lib/utils"

type TokenWord  = { type: "word";  text: string; index: number }
type TokenBlank = { type: "blank"; wordIndex: number; answer: string }
type Token      = TokenWord | TokenBlank

type BlankState = "idle" | "correct" | "incorrect"

interface FillInBlankProps {
  initialQuestion: GameQuestion
  profile: Profile
  filters?: Partial<SessionFilters>
  onProfileUpdate: (updates: { xp: number; level: number }) => void
  streak: number
  onStreakChange: (streak: number) => void
  mode: GameMode
}

function buildTokens(question: GameQuestion): Token[] {
  const blankSet  = new Set(question.wordIndices ?? [])
  const answerMap = new Map<number, string>(
    (question.wordIndices ?? []).map((idx, i) => [idx, question.answers?.[i] ?? ""])
  )
  return question.text.split(" ").map((word, index): Token => {
    if (blankSet.has(index)) {
      return { type: "blank", wordIndex: index, answer: answerMap.get(index) ?? "" }
    }
    return { type: "word", text: word, index }
  })
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MILESTONE_LABELS: Record<StreakMilestone, { emoji: string; label: string; sub: string }> = {
  cute:  { emoji: "⭐", label: "3x Streak!",  sub: "Keep it up!" },
  cool:  { emoji: "🔥", label: "5x Streak!",  sub: "You're on fire!" },
  crazy: { emoji: "💥", label: "Streak!!",     sub: "ABSOLUTELY UNREAL!!" },
}

export function FillInBlank({
  initialQuestion,
  profile,
  filters,
  onProfileUpdate,
  streak,
  onStreakChange,
  mode,
}: FillInBlankProps) {
  // ── Core state ───────────────────────────────────────────────
  const [question, setQuestion]       = useState(initialQuestion)
  const [answers, setAnswers]         = useState<Record<number, string>>({})
  const [blankStates, setBlankStates] = useState<Record<number, BlankState>>({})
  const [submitted, setSubmitted]     = useState(false)
  const [loading, setLoading]         = useState(false)
  const [levelUpLevel, setLevelUpLevel]       = useState<number | null>(null)
  const [xpFloats, setXpFloats]               = useState<{ id: number; text: string }[]>([])
  const [activeMilestone, setActiveMilestone] = useState<{ type: StreakMilestone; count: number } | null>(null)

  // ── Phase state ──────────────────────────────────────────────
  const [phase, setPhase]                         = useState<"blanks" | "reference" | "complete">("blanks")
  const [refOptions, setRefOptions]               = useState<string[]>([])
  const [refInput, setRefInput]                   = useState("")
  const [refResult, setRefResult]                 = useState<"correct" | "incorrect" | null>(null)
  const [selectedRefOption, setSelectedRefOption] = useState<string | null>(null)
  const [blanksAllCorrect, setBlanksAllCorrect]   = useState(false)
  const [fetchingRef, setFetchingRef]             = useState(false)

  // ── Refs ─────────────────────────────────────────────────────
  const xpFloatId       = useRef(0)
  const startTime       = useRef(Date.now())
  const blankResponseMs = useRef(0)
  const inputRefs       = useRef<Map<number, HTMLInputElement>>(new Map())

  const tokens = buildTokens(question)
  const blanks = tokens.filter((t): t is TokenBlank => t.type === "blank")

  // ── Helpers ──────────────────────────────────────────────────
  function setAnswer(wordIndex: number, value: string) {
    setAnswers((a) => ({ ...a, [wordIndex]: value }))
  }

  function showXpFloat(text: string) {
    const id = xpFloatId.current++
    setXpFloats((f) => [...f, { id, text }])
    setTimeout(() => setXpFloats((f) => f.filter((i) => i.id !== id)), 1300)
  }

  function triggerMilestone(milestone: StreakMilestone, newStreak: number) {
    setActiveMilestone({ type: milestone, count: newStreak })
    const duration = milestone === "crazy" ? 2200 : milestone === "cool" ? 1800 : 1500
    setTimeout(() => setActiveMilestone(null), duration)
    if (milestone === "cute") playStreak3()
    else if (milestone === "cool") playStreak5()
    else {
      playStreak10()
      confetti({
        particleCount: 220,
        spread: 120,
        origin: { y: 0.5 },
        colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#f5d020"],
      })
    }
  }

  async function callSubmitRound(args: {
    correctCount: number
    incorrectCount: number
    allCorrect: boolean
    newStreak: number
    refCorrect?: boolean
  }) {
    setLoading(true)
    const result = await submitRound({
      questionId:     question.questionId,
      verseRefId:     question.verseRefId,
      correctCount:   args.correctCount,
      incorrectCount: args.incorrectCount,
      allCorrect:     args.allCorrect,
      responseTimeMs: blankResponseMs.current,
      streak:         args.newStreak,
      mode,
      refCorrect:     args.refCorrect,
    })
    setLoading(false)
    if (!result.error && result.newXp !== undefined) {
      onProfileUpdate({ xp: result.newXp, level: result.newLevel! })
      if (result.leveledUp) setLevelUpLevel(result.newLevel!)
    }
  }

  // ── Blank submission ─────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitted || loading) return

    // Capture blank-phase response time before any awaits
    blankResponseMs.current = Date.now() - startTime.current

    const results: Record<number, boolean> = {}
    blanks.forEach((t) => {
      results[t.wordIndex] = checkAnswer(answers[t.wordIndex] ?? "", t.answer)
    })

    const newStates: Record<number, BlankState> = {}
    blanks.forEach((t) => {
      newStates[t.wordIndex] = results[t.wordIndex] ? "correct" : "incorrect"
    })
    setBlankStates(newStates)
    setSubmitted(true)

    const correctCount   = Object.values(results).filter(Boolean).length
    const incorrectCount = blanks.length - correctCount
    const allCorrect     = incorrectCount === 0

    blanks.forEach((t) => {
      if (results[t.wordIndex]) playCorrect()
      else playIncorrect()
    })

    setBlanksAllCorrect(allCorrect)

    if (mode === "easy") {
      const newStreak = allCorrect ? streak + 1 : 0
      onStreakChange(newStreak)

      const milestone = allCorrect ? getStreakMilestone(newStreak) : null
      if (milestone) triggerMilestone(milestone, newStreak)

      const blank_xp =
        correctCount * XP_CORRECT +
        incorrectCount * XP_INCORRECT +
        (allCorrect ? XP_STREAK_BONUS + streakXpBonus(newStreak) : 0)
      const totalXp = Math.round(blank_xp * MODE_MULTIPLIERS.easy)

      if (allCorrect) {
        if (!milestone) playVerseComplete()
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#f5d020", "#f5a623", "#fff"] })
        const streakLabel = newStreak >= 3 ? ` · ${newStreak}x Streak` : ""
        toast.success(`✓ Perfect!${streakLabel} +${totalXp} XP`)
        showXpFloat(`+${totalXp} XP`)
      } else if (correctCount > 0) {
        toast(`✅ ${correctCount}/${blanks.length} correct! +${totalXp} XP`)
        showXpFloat(`+${totalXp} XP`)
      } else {
        toast.error("Keep trying — you'll get it!")
        showXpFloat(`+${totalXp} XP`)
      }

      await callSubmitRound({ correctCount, incorrectCount, allCorrect, newStreak })
      setPhase("complete")
    } else {
      if (mode === "medium") {
        setFetchingRef(true)
        setPhase("reference")
        try {
          const distractors = await getDistractors(question.verseRefId, 2)
          setRefOptions(shuffle([question.reference, ...distractors]))
        } catch {
          setRefOptions(shuffle([question.reference, "Genesis 1:1", "Revelation 22:21"]))
        }
        setFetchingRef(false)
      } else {
        setPhase("reference")
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, loading, blanks, answers, question, streak, mode, onStreakChange])

  // ── Reference submission ─────────────────────────────────────
  const handleReferenceSubmit = useCallback(async (selectedOption?: string) => {
    if (refResult !== null || loading) return

    let refCorrect = false
    if (mode === "medium" && selectedOption !== undefined) {
      setSelectedRefOption(selectedOption)
      refCorrect = selectedOption === question.reference
    } else if (mode === "hard") {
      const parsed = parseReference(refInput)
      if (parsed) {
        refCorrect =
          parsed.book    === question.book &&
          parsed.chapter === question.chapter &&
          parsed.verse   === question.verse
      }
    }
    setRefResult(refCorrect ? "correct" : "incorrect")

    const allCorrectFull = blanksAllCorrect && refCorrect
    const newStreak = allCorrectFull ? streak + 1 : 0
    onStreakChange(newStreak)

    const milestone = allCorrectFull ? getStreakMilestone(newStreak) : null
    if (milestone) triggerMilestone(milestone, newStreak)

    const correctCount   = blanks.filter((t) => blankStates[t.wordIndex] === "correct").length
    const incorrectCount = blanks.length - correctCount
    const blank_xp =
      correctCount * XP_CORRECT +
      incorrectCount * XP_INCORRECT +
      (blanksAllCorrect ? XP_STREAK_BONUS + streakXpBonus(newStreak) : 0)
    const ref_xp  = refCorrect ? XP_REFERENCE_CORRECT : 0
    const totalXp = Math.round((blank_xp + ref_xp) * MODE_MULTIPLIERS[mode])

    if (allCorrectFull) {
      if (!milestone) playVerseComplete()
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#f5d020", "#f5a623", "#fff"] })
      const streakLabel = newStreak >= 3 ? ` · ${newStreak}x Streak` : ""
      toast.success(`✓ Perfect!${streakLabel} +${totalXp} XP`)
      showXpFloat(`+${totalXp} XP`)
    } else if (totalXp > 0) {
      toast(`+${totalXp} XP`)
      showXpFloat(`+${totalXp} XP`)
    } else {
      toast.error("Keep trying — you'll get it!")
      showXpFloat(`+0 XP`)
    }

    await callSubmitRound({ correctCount, incorrectCount, allCorrect: blanksAllCorrect, newStreak, refCorrect })
    setPhase("complete")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refResult, loading, mode, question, refInput, blanksAllCorrect, streak, blanks, blankStates, onStreakChange])

  // ── Next verse ───────────────────────────────────────────────
  async function handleNext() {
    setLoading(true)
    setActiveMilestone(null)
    const { question: next } = await getRandomQuestion(filters, question.questionId)
    setLoading(false)
    if (!next) {
      toast.error("No more verses right now. Check back soon!")
      return
    }
    setQuestion(next)
    setAnswers({})
    setBlankStates({})
    setSubmitted(false)
    setPhase("blanks")
    setRefOptions([])
    setRefInput("")
    setRefResult(null)
    setSelectedRefOption(null)
    setBlanksAllCorrect(false)
    startTime.current = Date.now()
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* XP floats */}
      <div className="fixed top-20 right-4 z-40 pointer-events-none space-y-1">
        {xpFloats.map((f) => (
          <span key={f.id} className="xp-float block text-primary font-black text-lg text-right">
            {f.text}
          </span>
        ))}
      </div>

      {/* Streak milestone overlay */}
      <AnimatePresence>
        {activeMilestone && (
          <motion.div
            key="milestone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "text-center px-10 py-6 rounded-3xl border-2 backdrop-blur-sm",
                activeMilestone.type === "cute"  && "bg-yellow-500/20 border-yellow-400",
                activeMilestone.type === "cool"  && "bg-orange-500/20 border-orange-500",
                activeMilestone.type === "crazy" && "bg-red-500/20 border-red-500",
              )}
            >
              <motion.div
                className="text-5xl mb-2"
                animate={
                  activeMilestone.type === "crazy"
                    ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }
                    : { scale: [1, 1.15, 1] }
                }
                transition={{ duration: 0.5 }}
              >
                {MILESTONE_LABELS[activeMilestone.type].emoji}
              </motion.div>
              <div className={cn(
                "font-black text-3xl",
                activeMilestone.type === "cute"  && "text-yellow-400",
                activeMilestone.type === "cool"  && "text-orange-400",
                activeMilestone.type === "crazy" && "text-red-400",
              )}>
                {activeMilestone.type === "crazy"
                  ? `${activeMilestone.count}x ${MILESTONE_LABELS.crazy.label}`
                  : MILESTONE_LABELS[activeMilestone.type].label}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {MILESTONE_LABELS[activeMilestone.type].sub}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {levelUpLevel && (
        <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      )}

      <div className="flex flex-col gap-6">
        {/* Streak counter */}
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div
              key={streak}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center justify-center gap-1.5"
            >
              <span className="text-orange-400 font-black text-xl">🔥 {streak}x streak</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reference badge: always on Easy; revealed at complete for Medium/Hard */}
        {(mode === "easy" || phase === "complete") && (
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-bold">
              {question.reference} · {question.translation}
            </span>
          </div>
        )}

        {/* Verse with blank inputs */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-lg font-semibold text-foreground leading-loose">
            {tokens.map((token, i) => {
              if (token.type === "word") {
                return <span key={i}>{token.text} </span>
              }
              const state        = blankStates[token.wordIndex] ?? "idle"
              const width        = blankWidth(token.answer)
              const blankIdx     = blanks.findIndex((b) => b.wordIndex === token.wordIndex)
              const isLastBlank  = blankIdx === blanks.length - 1
              const nextBlank    = blanks[blankIdx + 1]
              return (
                <span key={i} className="inline-flex items-center">
                  <motion.input
                    type="text"
                    inputMode="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    enterKeyHint={isLastBlank ? "done" : "next"}
                    ref={(el) => {
                      if (el) inputRefs.current.set(token.wordIndex, el)
                      else inputRefs.current.delete(token.wordIndex)
                    }}
                    value={answers[token.wordIndex] ?? ""}
                    onChange={(e) => setAnswer(token.wordIndex, e.target.value)}
                    disabled={submitted}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" || submitted) return
                      if (!isLastBlank && nextBlank) {
                        e.preventDefault()
                        inputRefs.current.get(nextBlank.wordIndex)?.focus()
                      } else {
                        handleSubmit()
                      }
                    }}
                    className={cn(
                      "inline-block mx-1 px-2 rounded-lg border-2 text-center font-bold text-base",
                      "bg-secondary text-foreground outline-none transition-all duration-200",
                      "focus:border-primary focus:shadow-[0_0_0_3px_oklch(0.85_0.18_90/0.25)]",
                      "min-h-[44px] align-middle",
                      state === "correct"   && "border-green-500 bg-green-500/15 text-green-400 correct-glow",
                      state === "incorrect" && "border-destructive bg-destructive/15 text-red-400",
                      state === "idle"      && "border-border",
                    )}
                    style={{ width: `${width + 2}ch` }}
                    animate={state === "incorrect" ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  />{" "}
                </span>
              )
            })}
          </p>
        </div>

        {/* Blank answer feedback */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {blanks.map((t) => {
                const correct = blankStates[t.wordIndex] === "correct"
                return (
                  <div
                    key={t.wordIndex}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold",
                      correct ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-red-400",
                    )}
                  >
                    {correct
                      ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                      : <XCircle className="w-4 h-4 shrink-0" />}
                    {correct ? (
                      <span>&ldquo;{t.answer}&rdquo; ✓</span>
                    ) : (
                      <span>
                        You wrote &ldquo;{answers[t.wordIndex] || "(blank)"}&rdquo; → &ldquo;{t.answer}&rdquo;
                      </span>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reference phase — Medium MCQ */}
        {phase === "reference" && mode === "medium" && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-center text-sm font-semibold text-muted-foreground">
                Which verse is this?
              </p>
              {fetchingRef ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {refOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleReferenceSubmit(option)}
                      disabled={refResult !== null || loading}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 text-sm font-bold text-left transition-all",
                        "disabled:cursor-not-allowed",
                        refResult === null && "border-border bg-secondary hover:border-primary/50",
                        selectedRefOption === option && refResult === "correct"   && "border-green-500 bg-green-500/15 text-green-400",
                        selectedRefOption === option && refResult === "incorrect" && "border-destructive bg-destructive/15 text-red-400",
                        selectedRefOption !== option && refResult !== null && option === question.reference && "border-green-500 bg-green-500/15 text-green-400",
                        selectedRefOption !== option && refResult !== null && option !== question.reference && "opacity-40",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Reference phase — Hard type-in */}
        {phase === "reference" && mode === "hard" && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-center text-sm font-semibold text-muted-foreground">
                Type the reference (e.g. &ldquo;John 3:16&rdquo;)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && refInput.trim() && refResult === null) {
                      handleReferenceSubmit()
                    }
                  }}
                  disabled={refResult !== null || loading}
                  placeholder="Book Chapter:Verse"
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl border-2 text-sm font-bold",
                    "bg-secondary text-foreground outline-none transition-all",
                    "focus:border-primary",
                    "disabled:opacity-50",
                    refResult === "correct"   && "border-green-500 bg-green-500/15 text-green-400",
                    refResult === "incorrect" && "border-destructive bg-destructive/15 text-red-400",
                    refResult === null        && "border-border",
                  )}
                />
                <Button
                  onClick={() => handleReferenceSubmit()}
                  disabled={!refInput.trim() || refResult !== null || loading}
                  className="px-4 rounded-xl font-bold"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Reference result (shown after ref submitted, persists through complete) */}
        <AnimatePresence>
          {(phase === "reference" || phase === "complete") && refResult !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold",
                refResult === "correct" ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-red-400",
              )}
            >
              {refResult === "correct" ? (
                <><CheckCircle2 className="w-4 h-4 shrink-0" /><span>Reference correct: {question.reference}</span></>
              ) : (
                <><XCircle className="w-4 h-4 shrink-0" /><span>Correct reference: {question.reference}</span></>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Check Answers button */}
        {phase === "blanks" && !submitted && (
          <Button
            onClick={handleSubmit}
            disabled={loading || blanks.every((t) => !answers[t.wordIndex])}
            className="w-full h-14 text-base font-black bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/30"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Check Answers"}
          </Button>
        )}

        {/* Next Verse button */}
        {phase === "complete" && (
          <Button
            onClick={handleNext}
            disabled={loading}
            className="w-full h-14 text-base font-black bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/30 gap-2"
          >
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><span>Next Verse</span><ArrowRight className="w-5 h-5" /></>}
          </Button>
        )}
      </div>
    </>
  )
}
