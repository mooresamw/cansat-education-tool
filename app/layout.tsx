import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { ThemeProvider } from "next-themes"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CanSat Educational Tool",
  description:
    "The CanSat Educational Tool is a web-based platform designed to provide students with hands-on learning experiences in satellite and space engineering. The platform offers resources like training materials, real-time communication tools, and a virtual Arduino IDE to help students improve technical skills and familiarize themselves with engineering practices in a simulated CanSat environment.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class">
          {children}
        </ThemeProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
