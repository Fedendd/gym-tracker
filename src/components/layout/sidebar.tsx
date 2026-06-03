"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  BookOpen,
  Activity,
  BarChart3,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workouts",  label: "Allenamenti", icon: Dumbbell },
  { href: "/programs",  label: "Programmi",   icon: ClipboardList },
  { href: "/exercises", label: "Esercizi",    icon: BookOpen },
  { href: "/cardio",    label: "Cardio",      icon: Activity },
  { href: "/analytics", label: "Progressi",   icon: BarChart3 },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0].toUpperCase() ?? "?"

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="p-5 border-b">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">Gym Tracker</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name ?? "Utente"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <LogOut className="h-4 w-4" />
          Esci
        </Button>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-stretch">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
            <span className="leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
