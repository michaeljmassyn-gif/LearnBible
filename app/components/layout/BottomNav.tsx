"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Gamepad2, Trophy, LogOut } from "lucide-react"
import { logoutUser } from "@/actions/auth"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/game", icon: Gamepad2, label: "Play" },
  { href: "/leaderboard", icon: Trophy, label: "Ranks" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", active && "drop-shadow-[0_0_8px_oklch(0.85_0.18_90/0.8)]")} />
              <span className={cn("text-xs font-bold", active ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          )
        })}

        {/* Logout */}
        <button
          onClick={() => logoutUser()}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs font-bold">Out</span>
        </button>
      </div>
    </nav>
  )
}
