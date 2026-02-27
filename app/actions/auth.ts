"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function registerUser(formData: {
  email: string
  password: string
  username: string
  first_name: string
  last_name: string
  grade: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  // Check username is unique before signing up
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", formData.username)
    .maybeSingle()

  if (existing) {
    return { error: "That username is already taken. Try another one!" }
  }

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        grade: formData.grade,
      },
    },
  })

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "An account with that email already exists." }
    }
    return { error: error.message }
  }

  return { success: true }
}

export async function loginUser(formData: {
  email: string
  password: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    return { error: "Incorrect email or password. Give it another shot!" }
  }

  return { success: true }
}

export async function logoutUser() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
