"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { registerUser } from "@/actions/auth"
import { GRADES } from "@/types"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    grade: "",
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.grade) {
      toast.error("Please select your grade.")
      return
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }
    setLoading(true)

    const result = await registerUser(form)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Join LearnBible</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your free account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                placeholder="Alex"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                required
                className="h-12 text-base bg-card border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="Smith"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                required
                className="h-12 text-base bg-card border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="bibleking99"
              value={form.username}
              onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
              required
              autoComplete="username"
              className="h-12 text-base bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              autoComplete="email"
              className="h-12 text-base bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              autoComplete="new-password"
              className="h-12 text-base bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Select onValueChange={(v) => set("grade", v)}>
              <SelectTrigger className="h-12 text-base bg-card border-border">
                <SelectValue placeholder="Select your grade" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g} className="text-base py-3">
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
