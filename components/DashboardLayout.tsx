"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"

import { auth } from "@/lib/firebaseConfig"
import { getUser } from "@/lib/getUser"
import {
  ActivityIcon,
  BookOpenIcon,
  ClockIcon,
  CodeIcon,
  FolderIcon,
  LogOut,
  MessageCircleIcon,
  MessageSquareIcon,
  Search,
  User,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: "admin" | "instructor" | "student"
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const userData = getUser()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!userData) {
    return <p className="text-center mt-10">Loading...</p>
  }

  // Overwrite userType with actual user role
  userType = userData.role as "admin" | "instructor" | "student"

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem("user")
      router.push("/")
    } catch (error: any) {
      console.error("Error signing out:", error.message)
    }
  }

  // Use simpler conditional classes to avoid hydration mismatches
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-sidebar-from to-sidebar-to border-r border-border shadow-lg flex flex-col">
        {/* Removed the logo; only the title remains. */}
        <div className="p-4 border-b border-border">
          <Link href={`/dashboard/${userData.role}`} className="text-lg font-bold hover:text-primary transition-colors">
            CanSat Educational
          </Link>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {userType === "admin" && (
            <>
              <NavItem href="/admin/accounts" icon={<User className="h-4 w-4" />}>
                Account Management
              </NavItem>
              <NavItem href="/admin/activity" icon={<ActivityIcon className="h-4 w-4" />}>
                Activity Monitoring
              </NavItem>
            </>
          )}

          {userType === "instructor" && (
            <>
              <NavItem href="/instructor/materials" icon={<FolderIcon className="h-4 w-4" />}>
                Access Materials
              </NavItem>
              <NavItem href="/instructor/time-tracking" icon={<ClockIcon className="h-4 w-4" />}>
                Time Tracking
              </NavItem>
              <NavItem href="/instructor/communication" icon={<MessageSquareIcon className="h-4 w-4" />}>
                Student Communication
              </NavItem>
            </>
          )}

          {userType === "student" && (
            <>
              <NavItem href="/dashboard/student/training-materials" icon={<BookOpenIcon className="h-4 w-4" />}>
                Access Resources
              </NavItem>
              <NavItem href="/dashboard/student/ide" icon={<CodeIcon className="h-4 w-4" />}>
                Virtual Arduino IDE
              </NavItem>
              <NavItem href="/dashboard/student/collaboration" icon={<UsersIcon className="h-4 w-4" />}>
                Collaboration Tools
              </NavItem>
              <NavItem href="/dashboard/student/messages" icon={<MessageCircleIcon className="h-4 w-4" />}>
                Direct Messaging
              </NavItem>
            </>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-border px-6 py-6 bg-header">
          {/* Search Bar (Remove if not needed) */}
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 bg-input text-input-foreground border-input focus:ring-0 focus:border-ring"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="relative w-24">
              <ThemeToggle></ThemeToggle>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full p-0 hover:scale-105 transition-transform"
                >
                  <Image
                    src="/placeholder.svg"
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-cover"
                  />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-64 bg-popover border border-border text-popover-foreground">
                <div className="flex flex-col space-y-4 p-2">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src="/placeholder.svg"
                        alt="Avatar"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">{userData.name}</h2>
                      <p className="text-sm text-muted-foreground">{userData.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Email:</strong> {userData.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-accent"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* MAIN SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">{children}</main>
      </div>
    </div>
  )
}

/**
 * NavItem - single navigation link with subtle hover effect
 */
function NavItem({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm text-nav-item
                 rounded-md hover:bg-nav-item-hover hover:text-nav-item-hover-foreground
                 transition-all duration-300 hover:pl-6"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}