import type React from "react"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: "admin" | "instructor" | "student"
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">CanSat Educational Tool</h1>
        </div>
        <nav className="space-y-1 px-2">
          {/* Add navigation items based on user type */}
          {userType === "admin" && (
            <>
              <NavItem href="/admin/accounts" icon={<UserIcon />}>
                Account Management
              </NavItem>
              <NavItem href="/admin/activity" icon={<ActivityIcon />}>
                Activity Monitoring
              </NavItem>
            </>
          )}
          {userType === "instructor" && (
            <>
              <NavItem href="/instructor/materials" icon={<FolderIcon />}>
                Access Materials
              </NavItem>
              <NavItem href="/instructor/time-tracking" icon={<ClockIcon />}>
                Time Tracking
              </NavItem>
              <NavItem href="/instructor/communication" icon={<MessageSquareIcon />}>
                Student Communication
              </NavItem>
            </>
          )}
          {userType === "student" && (
            <>
              <NavItem href="/student/resources" icon={<BookOpenIcon />}>
                Access Resources
              </NavItem>
              <NavItem href="/student/arduino-ide" icon={<CodeIcon />}>
                Virtual Arduino IDE
              </NavItem>
              <NavItem href="/student/collaboration" icon={<UsersIcon />}>
                Collaboration Tools
              </NavItem>
              <NavItem href="/student/messages" icon={<MessageCircleIcon />}>
                Direct Messaging
              </NavItem>
            </>
          )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div className="w-96">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Search..." className="pl-9" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 overflow-hidden rounded-full">
              <Image
                src="/placeholder.svg"
                alt="Avatar"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

function NavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <a href={href} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100">
      {icon}
      <span>{children}</span>
    </a>
  )
}

// Import these icons from lucide-react
import {
  UserIcon,
  ActivityIcon,
  FolderIcon,
  ClockIcon,
  MessageSquareIcon,
  BookOpenIcon,
  CodeIcon,
  UsersIcon,
  MessageCircleIcon,
} from "lucide-react"