"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Target,
  Bell,
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
    <nav className="w-56 border-r bg-card flex flex-col py-6 px-3 gap-1 shrink-0">
      <div className="px-3 mb-6">
        <h1 className="text-lg font-bold tracking-tight">Lum</h1>
        <p className="text-xs text-muted-foreground">Gestão de Avaliações</p>
      </div>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "justify-start gap-3 w-full",
            pathname === href || (href !== "/" && pathname.startsWith(href))
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              : "text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
