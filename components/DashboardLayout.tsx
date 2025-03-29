"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "admin" | "instructor" | "student";
}

const BOTTT_AVATARS = [
  { style: "bottts", seed: "bot1" },
  { style: "bottts", seed: "bot2" },
  { style: "bottts", seed: "bot3" },
  { style: "bottts", seed: "bot4" },
  { style: "bottts", seed: "bot5" },
  { style: "bottts", seed: "bot6" },
];

const getUser = () => {
  return JSON.parse(localStorage.getItem("user") || "null");
};

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const userData = getUser();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = React.useState(false);
  const [avatarSeed, setAvatarSeed] = React.useState("");

  React.useEffect(() => {
    const fetchAvatarSeed = async () => {
      setMounted(true);
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const response = await fetch("http://127.0.0.1:8080/user/avatar", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            setAvatarSeed(data.avatarSeed || Math.random().toString(36).substring(2));
          } else {
            // Fallback if backend fails or no seed exists
            const newSeed = Math.random().toString(36).substring(2);
            setAvatarSeed(newSeed);
            await saveAvatarSeedToBackend(newSeed, token);
          }
        } else {
          // No user logged in, use a random seed as fallback
          setAvatarSeed(Math.random().toString(36).substring(2));
        }
      } catch (error) {
        console.error("Error fetching avatar seed:", error);
        setAvatarSeed(Math.random().toString(36).substring(2)); // Fallback on error
      }
    };

    fetchAvatarSeed();
  }, []);

  if (!userData) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  userType = userData.role as "admin" | "instructor" | "student";

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

      await signOut(auth);
      localStorage.removeItem("user");
      router.push("/");
    } catch (error: any) {
      console.error("Error signing out:", error.message);
    }
  };

  const getAvatarUrl = (style: string, seed: string) => {
    return `https://api.dicebear.com/7.x/${style}/png?seed=${seed}`;
  };

  const saveAvatarSeedToBackend = async (newSeed: string, token: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8080/user/avatar", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarSeed: newSeed, avatarStyle: "bottts" }),
      });
      if (!response.ok) {
        console.error("Failed to save avatar seed:", await response.text());
      }
    } catch (error) {
      console.error("Error saving avatar seed:", error);
    }
  };

  const handleAvatarChange = async (newSeed: string) => {
    setAvatarSeed(newSeed);
    setShowAvatarPicker(false);
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      await saveAvatarSeedToBackend(newSeed, token);
    }
    const updatedUser = { ...userData, avatarSeed: newSeed, avatarStyle: "bottts" };
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const currentStyle = userData.avatarStyle || "bottts";
  const avatarUrl = getAvatarUrl(currentStyle, avatarSeed);

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
              <NavItem
                href="/instructor/communication"
                icon={<MessageSquareIcon className="h-4 w-4" />}
              >
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
              <NavItem href="/ide" icon={<CodeIcon className="h-4 w-4" />}>
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
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-6 bg-header">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 bg-input text-input-foreground border-input focus:ring-0 focus:border-ring"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-24">
              <ThemeToggle />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full p-0 hover:scale-105 transition-transform"
                >
                  <Image
                    src={avatarUrl}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/default-avatar.png";
                    }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-popover border border-border text-popover-foreground">
                <div className="flex flex-col space-y-4 p-2">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={avatarUrl}
                        alt="User Avatar"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-avatar.png";
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">{userData.name}</h2>
                      <p className="text-sm text-muted-foreground">{userData.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="w-full bg-primary text-white text-sm py-1 px-2 rounded-md hover:bg-primary-dark"
                  >
                    Edit Avatar
                  </button>

                  {showAvatarPicker && (
                    <div className="border-t border-border pt-4">
                      <h3 className="text-sm font-medium mb-2">Choose Avatar Style</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {BOTTT_AVATARS.map((avatar) => (
                          <button
                            key={avatar.seed}
                            onClick={() => handleAvatarChange(avatar.seed)}
                            className={`p-1 rounded-md ${
                              avatarSeed === avatar.seed && currentStyle === avatar.style
                                ? "ring-2 ring-primary"
                                : "hover:ring-1 hover:ring-border"
                            }`}
                          >
                            <Image
                              src={getAvatarUrl(avatar.style, avatar.seed)}
                              alt={`${avatar.seed} avatar`}
                              width={40}
                              height={40}
                              className="rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/default-avatar.png";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
        <main className="flex-1 overflow-y-auto p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
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