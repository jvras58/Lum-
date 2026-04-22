"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Target,
  Bell,
  GraduationCap,
} from "lucide-react"

const navItems = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard },
  { href: "/alunos",       label: "Alunos",       icon: Users },
  { href: "/turmas",       label: "Turmas",       icon: BookOpen },
  { href: "/metas",        label: "Metas",        icon: Target },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
] as const

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="w-60 border-r bg-card flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight leading-none">Lum</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-1">
              Gestão de Avaliações
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
          Menu
        </p>
        <div className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Theme toggle footer */}
      <div className="px-5 py-4 border-t flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Aparência</p>
        <ThemeToggle />
      </div>
    </nav>
  )
}
