import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <div className="flex min-h-screen bg-background">
              <SidebarNav />
              <main className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto px-8 py-8">
                  {children}
                </div>
              </main>
            </div>
            <Toaster richColors position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
