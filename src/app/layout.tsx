import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Lum — Gestão de Alunos e Avaliações",
  description: "Sistema de gerenciamento de alunos, turmas e avaliações",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
          <div className="flex min-h-screen">
            <SidebarNav />
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </div>
          <Toaster richColors position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
