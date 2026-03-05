import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Town of Arkaoda - Online Sosyal Cikarim Oyunu",
  description: "Town of Salem benzeri, tarayici tabanli, online multiplayer sosyal cikarim oyunu.",
}

import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <main className="min-h-screen">{children}</main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
