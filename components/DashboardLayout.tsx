"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebaseConfig";
import { getUser } from "@/lib/getUser";
import {
  ActivityIcon,
  Bell,
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "admin" | "instructor" | "student";
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const userData = getUser();
  const router = useRouter();

  if (!userData) {
    return <p className="text-center mt-10 text-white">Loading...</p>;
  }

  // Overwrite userType with actual user role
  userType = userData.role as "admin" | "instructor" | "student";

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      router.push("/");
    } catch (error: any) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 shadow-lg flex flex-col">
        {/* Removed the logo; only the title remains. */}
        <div className="p-4 border-b border-gray-700">
          <Link
            href={`/dashboard/${userData.role}`}
            className="text-lg font-bold hover:text-gray-200 transition-colors"
          >
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
              <NavItem
                href="/dashboard/student/training-materials"
                icon={<BookOpenIcon className="h-4 w-4" />}
              >
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
        <header className="flex items-center justify-between border-b border-gray-700 px-6 py-6 bg-gray-800">
          {/* Search Bar (Remove if not needed) */}
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 bg-gray-700 text-white border-gray-600 focus:ring-0 focus:border-gray-500"
            />
          </div>

          {/* Icons / Avatar */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Bell className="h-6 w-6" />
            </Button>

            {/* Profile / Sign Out Popover */}
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

              <PopoverContent className="w-64 bg-gray-800 border border-gray-700 text-white">
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
                      <p className="text-sm text-gray-400">{userData.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>
                      <strong className="text-white">Email:</strong> {userData.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-gray-200 hover:bg-gray-700"
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
        <main className="flex-1 overflow-y-auto p-6 bg-gray-900">{children}</main>
      </div>
    </div>
  );
}

/**
 * NavItem - single navigation link with subtle hover effect
 */
function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300
                 rounded-md hover:bg-gray-700 hover:text-white
                 transition-all duration-300 hover:pl-6"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
