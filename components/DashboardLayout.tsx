"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import {
  ActivityIcon,
  BookOpenIcon,
  ClockIcon,
  CodeIcon,
  FolderIcon,
  FolderOpenIcon,
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
import { ThemeToggle } from "@/components/theme-toggle";
import { Notifications } from "@/components/Notifications";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "admin" | "instructor" | "student";
}

const LOCAL_AVATARS = [
  { id: "avatar1", path: "/avatars/avatar1.png" },
  { id: "avatar2", path: "/avatars/avatar2.png" },
  { id: "avatar3", path: "/avatars/avatar3.png" },
  { id: "avatar4", path: "/avatars/avatar4.png" },
  { id: "avatar5", path: "/avatars/avatar5.png" },
  { id: "avatar6", path: "/avatars/avatar6.png" },
];

// Move getUser inside the component and use useState/useEffect
export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [userData, setUserData] = React.useState<any>(null); // Initialize as null
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = React.useState(false);
  const [avatarSeed, setAvatarSeed] = React.useState<number | null>(null);

  // Load user data from localStorage only on client-side
  React.useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUserData(parsedUser);
    setAvatarSeed(parsedUser?.avatarSeed || 1);
    setMounted(true); // Mark as mounted after first render
  }, []);

  const userId = userData?.user_id;
  const avatarPath = LOCAL_AVATARS[(avatarSeed || 1) - 1]?.path || LOCAL_AVATARS[0].path;

  // Role-based route protection
  React.useEffect(() => {
    if (!mounted || !userData) return; // Wait until mounted and userData is set

    const userRole = userData.role as "admin" | "instructor" | "student";
    const allowedRoutes = {
      admin: ["/dashboard"], // Admin can access any dashboard route
      instructor: ["/dashboard/instructor"],
      student: ["/dashboard/student"],
    };

    const isAuthorized =
      userRole === "admin"
        ? pathname.startsWith("/dashboard") // Admin can access any /dashboard/* route
        : allowedRoutes[userRole].some((route) => pathname.startsWith(route));

    if (!isAuthorized) {
      router.push(`/dashboard/${userRole}`);
    }
  }, [pathname, userData, router, mounted]);

  // Sync avatar with backend
  React.useEffect(() => {
    const syncAvatarWithBackend = async () => {
      if (!userData || !mounted) return;

      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const response = await fetch("http://127.0.0.1:8080/user/avatar", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            const backendSeed = data.avatarSeed || 1;
            if (backendSeed !== avatarSeed) {
              setAvatarSeed(backendSeed);
              const updatedUser = { ...userData, avatarSeed: backendSeed };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setUserData(updatedUser);
            }
          } else {
            const newSeed = 1;
            setAvatarSeed(newSeed);
            await saveAvatarSeedToBackend(newSeed, token);
            const updatedUser = { ...userData, avatarSeed: newSeed };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUserData(updatedUser);
          }
        } else if (!avatarSeed) {
          setAvatarSeed(1);
        }
      } catch (error) {
        console.error("Error syncing avatar with backend:", error);
        if (!avatarSeed) {
          setAvatarSeed(1);
        }
      }
    };

    if (mounted) {
      syncAvatarWithBackend();
    }
  }, [mounted, userData, avatarSeed]);

  if (!mounted) {
    return <p className="text-center mt-10">Loading...</p>; // Show loading until client-side mount
  }

  if (!userData) {
    router.push("/"); // Redirect to login if no user data
    return null;
  }

  const handleSignOut = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        const logoutResponse = await fetch("http://127.0.0.1:8080/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });
        if (!logoutResponse.ok) {
          console.error("Logout logging failed:", await logoutResponse.text());
        }
      }

      //await signOut(auth);
      localStorage.removeItem("user");
      router.push("/");
    } catch (error: any) {
      console.error("Error signing out:", error.message);
    }
  };

  const saveAvatarSeedToBackend = async (newSeed: number, token: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8080/user/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarSeed: newSeed }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to save avatar seed:", errorText);
        throw new Error(errorText);
      }
    } catch (error) {
      console.error("Error saving avatar seed:", error);
      throw error;
    }
  };

  const handleAvatarChange = async (index: number) => {
    try {
      const newSeed = index + 1;
      setAvatarSeed(newSeed);
      setShowAvatarPicker(false);
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        await saveAvatarSeedToBackend(newSeed, token);
      }
      const updatedUser = { ...userData, avatarSeed: newSeed };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUserData(updatedUser);
    } catch (error) {
      console.error("Failed to update avatar:", error);
      setAvatarSeed(userData.avatarSeed || 1);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 bg-gradient-to-b from-sidebar-from to-sidebar-to border-r border-border shadow-lg flex flex-col">
        <div className="p-4 border-b border-border">
          <Link
            href={`/dashboard/${userData.role}`}
            className="text-lg font-bold hover:text-primary transition-colors"
          >
            CanSat Educational
          </Link>
        </div>
        <nav className="space-y-1 px-2">
          {userData.role === "admin" && (
            <>
              <NavItem href="/dashboard/admin/logs" icon={<ActivityIcon className="h-4 w-4" />}>
                Activity Monitoring
              </NavItem>
              <NavItem href="/dashboard/admin/resource-manager" icon={<FolderOpenIcon className="h-4 w-4" />}>
                Resource Management
              </NavItem>
            </>
          )}
          {userData.role === "instructor" && (
            <>
              <NavItem href="/dashboard/student/training-materials" icon={<FolderIcon className="h-4 w-4" />}>
                Access Materials
              </NavItem>
              <NavItem
                href="/dashboard/instructor/message"
                icon={<MessageSquareIcon className="h-4 w-4" />}
              >
                Student Communication
              </NavItem>
            </>
          )}
          {userData.role === "student" && (
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
              <NavItem href="/dashboard/student/messageStudent" icon={<UsersIcon className="h-4 w-4" />}>
                Collaboration Tools
              </NavItem>
              <NavItem href="/dashboard/student/message" icon={<MessageCircleIcon className="h-4 w-4" />}>
                Direct Messaging
              </NavItem>
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-6 bg-header">
          <div className="relative w-72"></div>
          <div className="flex items-center gap-16">
            <div className="relative w-8">
              <ThemeToggle />
            </div>
            <Notifications userId={userId} userRole={userData.role} />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-12 w-12 rounded-full p-0 hover:scale-105 transition-transform focus:ring-2 focus:ring-primary"
                >
                  <Image
                    src={avatarPath}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="h-full w-full rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/avatars/avatar1.png";
                    }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-popover border border-border text-popover-foreground shadow-xl rounded-lg p-0">
                <div className="flex flex-col space-y-4 p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-primary/20">
                      <Image
                        src={avatarPath}
                        alt="User Avatar"
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/avatars/avatar1.png";
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{userData.name}</h2>
                      <p className="text-sm text-muted-foreground capitalize">{userData.role}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="w-full border-primary/20 hover:bg-primary/5 text-primary transition-colors"
                  >
                    {showAvatarPicker ? "Close Avatar Picker" : "Change Avatar"}
                  </Button>

                  {showAvatarPicker && (
                    <div className="border-t border-border pt-4 -mx-4 px-4 bg-muted/10">
                      <h3 className="text-sm font-medium mb-3 text-foreground">Select Your Avatar</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {LOCAL_AVATARS.map((avatar, index) => (
                          <button
                            key={avatar.id}
                            onClick={() => handleAvatarChange(index)}
                            className={`relative group rounded-full overflow-hidden transition-all duration-200 ${
                              avatarSeed === index + 1
                                ? "ring-2 ring-primary scale-105"
                                : "hover:ring-2 hover:ring-primary/50 hover:scale-105"
                            }`}
                          >
                            <Image
                              src={avatar.path}
                              alt={`${avatar.id} avatar`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/avatars/avatar1.png";
                              }}
                            />
                            <div
                              className={`absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-opacity ${
                                avatarSeed === index + 1 ? "bg-black/20" : ""
                              }`}
                            ></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground pt-2">
                    <p>
                      <strong className="text-foreground">Email:</strong> {userData.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
        <main className="flex-1 overflow-y-auto p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}

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
      className="flex items-center gap-2 px-3 py-2 text-sm text-nav-item rounded-md hover:bg-nav-item-hover hover:text-nav-item-hover-foreground transition-all duration-300 hover:pl-6"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}