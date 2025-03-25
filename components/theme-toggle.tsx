"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)

  }, [theme, resolvedTheme])

  // Direct theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === "dark" || resolvedTheme === "dark" ? "light" : "dark"
    //console.log(`Setting theme to: ${newTheme}`)
    setTheme(newTheme)

    // Force apply the class for testing
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0" />
  }

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50">
          <DropdownMenuItem
            onClick={() => {
             // console.log("Setting theme to light")
              setTheme("light")
              document.documentElement.classList.remove("dark")
            }}
            className="cursor-pointer"
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              //console.log("Setting theme to dark")
              setTheme("dark")
              document.documentElement.classList.add("dark")
            }}
            className="cursor-pointer"
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              //console.log("Setting theme to system")
              setTheme("system")
            }}
            className="cursor-pointer"
          >
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

