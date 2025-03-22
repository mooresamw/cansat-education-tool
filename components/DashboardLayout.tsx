import type React from "react"
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
  UsersIcon
} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import Image from "next/image"
import { auth, db } from '@/lib/firebaseConfig';
import {signOut} from "firebase/auth";
import {useRouter} from "next/navigation"; // Import Firebase config
import {getUser} from "@/lib/getUser";

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: "admin" | "instructor" | "student"
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const userData = getUser();
  userType = userData.role;
  if(!userData) return <p>Loading...</p>;

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        localStorage.removeItem("user"); // Remove user data from local storage
        console.log("User signed out successfully!");
        router.push("/"); // Redirect to home or login page
    } catch (error: any) {
        console.log("Error signing out:", error.message);
    }
  };
  const router = useRouter();
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r">
        <div className="p-4">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push(`/dashboard/${userData.role}`)}>CanSat Educational Tool</h1>
        </div>
        <nav className="space-y-1 px-2">
          {/* Add navigation items based on user type */}
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
              <NavItem href="student/training-materials" icon={<BookOpenIcon className="h-4 w-4" />}>
                Access Resources
              </NavItem>
              <NavItem href="ide" icon={<CodeIcon className="h-4 w-4" />}>
                Virtual Arduino IDE
              </NavItem>
              <NavItem href="/student/collaboration" icon={<UsersIcon className="h-4 w-4" />}>
                Collaboration Tools
              </NavItem>
              <NavItem href="/student/messages" icon={<MessageCircleIcon className="h-4 w-4" />}>
                Direct Messaging
              </NavItem>
            </>
          )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b px-6 py-6">
          <div className="w-96">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Search..." className="pl-9" />
            </div>
          </div>
          <div className="flex items-center gap-8">
            <Button variant="ghost" size="icon">
              <Bell className="h-6 w-6" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Image
                    src="/placeholder.svg"
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-cover"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="flex flex-col space-y-4">
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
                      <h2 className="text-lg font-semibold">{userData.name}</h2>
                      <p className="text-sm text-gray-500">{userData.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Email:</strong> {userData.email}
                    </p>
                    <p className="text-sm">
                      <strong>Role:</strong> {userData.role}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => handleSignOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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

