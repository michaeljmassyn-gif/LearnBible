"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { playLevelUp } from "@/lib/sounds"
import confetti from "canvas-confetti"

interface LevelUpModalProps {
  level: number
  onClose: () => void
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  useEffect(() => {
    playLevelUp()
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#f5d020", "#f5a623", "#ffffff", "#a8edea"],
    })
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 14, stiffness: 180 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-primary/40 rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl shadow-primary/20"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40"
          >
            <Star className="w-10 h-10 text-primary-foreground fill-primary-foreground" />
          </motion.div>

          <h2 className="text-3xl font-black text-primary mb-1">LEVEL UP!</h2>
          <p className="text-5xl font-black text-foreground mb-2">{level}</p>
          <p className="text-muted-foreground text-sm mb-6">
            You&apos;re crushing it! Keep going!
          </p>

          <Button
            onClick={onClose}
            className="w-full h-12 font-black text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30"
          >
            Keep Playing!
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
