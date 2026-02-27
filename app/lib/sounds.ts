/**
 * Synthesized sound effects via Web Audio API.
 * No file downloads needed — works great on mobile.
 */

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!window.AudioContext && !(window as unknown as { webkitAudioContext: AudioContext }).webkitAudioContext) return null
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return new Ctx()
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gainValue = 0.3
) {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.9, ctx.currentTime + duration)

  gainNode.gain.setValueAtTime(gainValue, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

/** Short positive chime — single correct blank */
export function playCorrect() {
  playTone(880, 0.15, "sine", 0.25)
  setTimeout(() => playTone(1100, 0.12, "sine", 0.18), 80)
}

/** Buzz — wrong answer */
export function playIncorrect() {
  playTone(200, 0.25, "sawtooth", 0.15)
}

/** Fanfare — all blanks correct in a verse */
export function playVerseComplete() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "sine", 0.25), i * 80)
  })
}

/** Level-up celebration */
export function playLevelUp() {
  const notes = [523, 659, 784, 1047, 1319]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, "sine", 0.3), i * 70)
  })
}

/** 3x streak — cute sparkly ascending arpeggio */
export function playStreak3() {
  const notes = [784, 988, 1175]   // G5 → B5 → D6 (G major)
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.14, "sine", 0.18), i * 70)
  })
}

/** 5x streak — cool smooth jazz-y run */
export function playStreak5() {
  const notes = [1047, 880, 698, 880, 1175]  // C6 → A5 → F5 → A5 → D6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.16, "triangle", 0.2), i * 80)
  })
}

/** 10x+ streak — epic full fanfare with sub bass */
export function playStreak10() {
  // Ascending fanfare
  const notes = [523, 659, 784, 1047, 1319, 1047, 1568]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "sine", 0.28), i * 65)
  })
  // Sub bass rumble
  playTone(80, 0.6, "sawtooth", 0.12)
  // High sparkle layer
  setTimeout(() => {
    [2093, 2637].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.1, "sine", 0.1), i * 80)
    })
  }, 200)
}
