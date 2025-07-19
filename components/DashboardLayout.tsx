"use client";

import type React from "react";
import { useEffect, useRef, useState, createContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import {
  ActivityIcon,
  BookOpenIcon,
  CodeIcon,
  FolderIcon,
  FolderOpenIcon,
  LogOut,
  MessageCircleIcon,
  MessageSquareIcon,
  UsersIcon,
  Settings,
  Search,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Notifications } from "@/components/Notifications";

// Context to signal sign-out to child components
export const SignOutContext = createContext<{ isSigningOut: boolean; setIsSigningOut: (value: boolean) => void }>({
  isSigningOut: false,
  setIsSigningOut: () => {},
});

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "admin" | "instructor" | "student";
}

interface SearchItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  keywords: string[];
}

const LOCAL_AVATARS = [
  { id: "avatar1", path: "/avatars/avatar1.png" },
  { id: "avatar2", path: "/avatars/avatar2.png" },
  { id: "avatar3", path: "/avatars/avatar3.png" },
  { id: "avatar4", path: "/avatars/avatar4.png" },
  { id: "avatar5", path: "/avatars/avatar5.png" },
  { id: "avatar6", path: "/avatars/avatar6.png" },
];

// Search data for all dashboard items
const SEARCH_ITEMS: SearchItem[] = [
  {
    title: "Activity Monitoring",
    href: "/dashboard/admin/logs",
    icon: <ActivityIcon className="h-4 w-4" />,
    roles: ["admin"],
    keywords: ["activity", "monitoring", "logs", "admin", "tracking", "audit"],
  },
  {
    title: "Resource Management",
    href: "/dashboard/admin/resource-manager",
    icon: <FolderOpenIcon className="h-4 w-4" />,
    roles: ["admin"],
    keywords: ["resource", "management", "manager", "admin", "files", "content"],
  },
  {
    title: "Access Materials",
    href: "/dashboard/student/training-materials",
    icon: <FolderIcon className="h-4 w-4" />,
    roles: ["instructor"],
    keywords: ["access", "materials", "training", "instructor", "resources", "content"],
  },
  {
    title: "Student Communication",
    href: "/dashboard/instructor/message",
    icon: <MessageSquareIcon className="h-4 w-4" />,
    roles: ["instructor"],
    keywords: ["student", "communication", "message", "instructor", "chat", "contact"],
  },
  {
    title: "Access Resources",
    href: "/dashboard/student/training-materials",
    icon: <BookOpenIcon className="h-4 w-4" />,
    roles: ["student"],
    keywords: ["access", "resources", "training", "materials", "student", "learning"],
  },
  {
    title: "Virtual Arduino IDE",
    href: "/dashboard/student/ide",
    icon: <CodeIcon className="h-4 w-4" />,
    roles: ["student"],
    keywords: ["virtual", "arduino", "ide", "code", "programming", "development"],
  },
  {
    title: "Collaboration Tools",
    href: "/dashboard/student/messageStudent",
    icon: <UsersIcon className="h-4 w-4" />,
    roles: ["student"],
    keywords: ["collaboration", "tools", "student", "teamwork", "group", "peers"],
  },
  {
    title: "Instructor Communication",
    href: "/dashboard/student/message",
    icon: <MessageCircleIcon className="h-4 w-4" />,
    roles: ["student"],
    keywords: ["instructor", "communication", "message", "teacher", "help", "support"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-4 w-4" />,
    roles: ["admin", "instructor", "student"],
    keywords: ["settings", "preferences", "configuration", "profile", "account"],
  },
];

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [userData, setUserData] = useState<any>(null);
  const [avatarSeed, setAvatarSeed] = useState<number>(1);
  const [mounted, setMounted] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar open by default on large screens
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hasSyncedAvatar = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load user data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    if (parsedUser) {
      setUserData(parsedUser);
      setAvatarSeed(parsedUser.avatarSeed || 1);
    } else {
      router.push("/");
    }
    setMounted(true);
  }, [router]);

  // Role-based route protection
  useEffect(() => {
    if (!mounted || !userData) return;
    const userRole = userData.role as "admin" | "instructor" | "student";
    const allowedRoutes = {
      admin: ["/dashboard"],
      instructor: ["/dashboard/instructor", "/dashboard/student"],
      student: ["/dashboard/student", "/dashboard/student/training-materials"],
    };

    const isAuthorized =
      userRole === "admin"
        ? pathname.startsWith("/dashboard")
        : allowedRoutes[userRole].some((route) => pathname.startsWith(route));

    if (!isAuthorized) {
      router.push(`/dashboard/${userRole}`);
    }
  }, [pathname, userData, router, mounted]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim() || !userData) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const userRole = userData.role;
    const filteredItems = SEARCH_ITEMS.filter((item) => {
      const hasRole = item.roles.includes(userRole);
      const matchesQuery =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some((keyword) => keyword.toLowerCase().includes(searchQuery.toLowerCase()));
      return hasRole && matchesQuery;
    });

    setSearchResults(filteredItems);
    setShowSearchResults(filteredItems.length > 0);
  }, [searchQuery, userData]);

  // Handle search item selection
  const handleSearchItemClick = (item: SearchItem) => {
    setSearchQuery("");
    setShowSearchResults(false);
    setMobileMenuOpen(false); // Close mobile menu when navigating

    if (pathname === item.href) {
      const element = document.querySelector(`[data-search-target="${item.title.toLowerCase().replace(/\s+/g, "-")}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      router.push(item.href);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    searchInputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      clearSearch();
    } else if (e.key === "Enter" && searchResults.length > 0) {
      handleSearchItemClick(searchResults[0]);
    }
  };

  // Toggle sidebar visibility (for desktop)
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    console.log(!sidebarOpen);
  };

  // Sync avatar with backend
  useEffect(() => {
    let isMounted = true;
    const syncAvatarWithBackend = async () => {
      if (!userData || !mounted || hasSyncedAvatar.current || isSigningOut) return;
      try {
        const user = auth.currentUser;
        if (user && isMounted) {
          const token = await user.getIdToken();
          console.log("Fetching avatar seed from backend");
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
            if (backendSeed !== userData.avatarSeed && isMounted) {
              console.log("Updating avatar seed to:", backendSeed);
              setAvatarSeed(backendSeed);
              const updatedUser = { ...userData, avatarSeed: backendSeed };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setUserData(updatedUser);
            }
          } else {
            const errorData = await response.json();
            console.error("Failed to fetch avatar seed:", errorData.error);
          }
          hasSyncedAvatar.current = true;
        }
      } catch (error) {
        console.error("Error syncing avatar with backend:", error);
        if (!userData.avatarSeed && isMounted) {
          setAvatarSeed(1);
          const updatedUser = { ...userData, avatarSeed: 1 };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUserData(updatedUser);
        }
        hasSyncedAvatar.current = true;
      }
    };

    if (mounted && userData) {
      syncAvatarWithBackend();
    }

    return () => {
      isMounted = false;
    };
  }, [mounted, userData, isSigningOut]);

  const saveAvatarSeedToBackend = async (newSeed: number, token: string) => {
    try {
      console.log("Saving avatar seed to backend:", newSeed);
      const response = await fetch("http://127.0.0.1:8080/user/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarSeed: newSeed }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to save avatar seed:", errorData.error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error saving avatar seed:", error);
      return false;
    }
  };

  const handleAvatarChange = async (index: number) => {
    try {
      const newSeed = index + 1;
      console.log("Changing avatar seed to:", newSeed);
      setAvatarSeed(newSeed);
      setShowAvatarPicker(false);

      const user = auth.currentUser;
      if (user && !isSigningOut) {
        const token = await user.getIdToken();
        const success = await saveAvatarSeedToBackend(newSeed, token);
        if (success) {
          const updatedUser = { ...userData, avatarSeed: newSeed };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUserData(updatedUser);
        } else {
          setAvatarSeed(userData.avatarSeed || 1);
        }
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
      setAvatarSeed(userData.avatarSeed || 1);
    }
  };

// DashboardLayout.tsx
const handleSignOut = async () => {
  try {
    setIsSigningOut(true);
    const user = auth.currentUser;
    let token: string | null = null;

    // Get the token before signing out
    if (user) {
      token = await user.getIdToken();
    }

    // Perform backend logout API call if token exists
    if (token) {
      try {
        const logoutResponse = await fetch("http://127.0.0.1:8080/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });

        if (!logoutResponse.ok) {
          console.error("Logout logging failed:", await logoutResponse.text());
        }
      } catch (error) {
        console.error("Error during logout API call:", error);
      }
    }

    // Sign out from Firebase
    await signOut(auth);

    // Clear localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("userId");

    // Navigate to login page
    router.push("/login");
  } catch (error: any) {
    console.error("Error signing out:", error.message);
  } finally {
    setIsSigningOut(false);
  }
};

  if (!mounted) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (!userData) {
    return null;
  }

  const avatarPath = LOCAL_AVATARS[(avatarSeed || 1) - 1]?.path || LOCAL_AVATARS[0].path;

  // Sidebar content component to reuse in both desktop and mobile
  const SidebarContent = ({ onNavClick, isMobile = false }: { onNavClick?: () => void; isMobile?: boolean }) => (
    <>
      <div className="p-4 ">
        <Link
          href={`/dashboard/${userData.role}`}
          className="text-lg font-bold hover:text-primary transition-colors block mb-4"
          onClick={onNavClick}
        >
          CanSat Education Tool
        </Link>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={isMobile ? undefined : searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-3xl bg-muted pl-9 pr-4 py-6 px-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full w-full right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchResults.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchItemClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  {item.icon}
                  <span className="flex-1">{item.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {item.roles[0]}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {userData.role === "admin" && (
          <>
            <NavItem href="/dashboard/admin/logs" icon={<ActivityIcon className="h-4 w-4" />} onClick={onNavClick}>
              Activity Monitoring
            </NavItem>
            <NavItem
              href="/dashboard/admin/resource-manager"
              icon={<FolderOpenIcon className="h-4 w-4" />}
              onClick={onNavClick}
            >
              Resource Management
            </NavItem>
          </>
        )}
        {userData.role === "instructor" && (
          <>
            <NavItem
              href="/dashboard/student/training-materials"
              icon={<FolderIcon className="h-4 w-4" />}
              onClick={onNavClick}
            >
              Access Materials
            </NavItem>
            <NavItem
              href="/dashboard/instructor/message"
              icon={<MessageSquareIcon className="h-4 w-4" />}
              onClick={onNavClick}
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
              onClick={onNavClick}
            >
              Access Resources
            </NavItem>
            <NavItem href="/dashboard/student/ide" icon={<CodeIcon className="h-4 w-4" />} onClick={onNavClick}>
              Virtual Arduino IDE
            </NavItem>
            <NavItem
              href="/dashboard/student/messageStudent"
              icon={<UsersIcon className="h-4 w-4" />}
              onClick={onNavClick}
            >
              Collaboration Tools
            </NavItem>
            <NavItem
              href="/dashboard/student/message"
              icon={<MessageCircleIcon className="h-4 w-4" />}
              onClick={onNavClick}
            >
              Instructor Communication
            </NavItem>
          </>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t p-2 space-y-16">
        {/* Settings Button */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-3 py-2 text-sm text-nav-item hover:bg-nav-item-hover hover:text-nav-item-hover-foreground transition-all duration-300"
          onClick={() => {
            router.push(`/dashboard/${userData.role}/`);
            onNavClick?.();
          }}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Button>

        {/* Secondary Profile Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-3 py-2 text-sm text-nav-item hover:bg-nav-item-hover hover:text-nav-item-hover-foreground transition-all duration-300"
            >
              <div className="relative">
                <Image
                  src={avatarPath || "/placeholder.svg"}
                  alt="User Avatar"
                  width={16}
                  height={16}
                  className="h-4 w-4 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/avatars/avatar1.png";
                  }}
                />
              </div>
              <span className="flex-1 text-left truncate">{userData.name}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                {userData.role}
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 bg-popover border border-border text-popover-foreground shadow-xl rounded-lg p-0"
            side="right"
            align="end"
          >
            <div className="flex flex-col space-y-4 p-4">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-primary/20">
                  <Image
                    src={avatarPath || "/placeholder.svg"}
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
                  <Badge
                    variant="secondary"
                    className="text-xs bg-primary/10 text-primary border-primary/20 capitalize"
                  >
                    {userData.role}
                  </Badge>
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
                          src={avatar.path || "/placeholder.svg"}
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
                className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors bg-transparent"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );

  return (
    <SignOutContext.Provider value={{ isSigningOut, setIsSigningOut }}>
      <div className="flex h-screen bg-background text-foreground">
        {/* Desktop Sidebar - Open by default on large screens */}
        <div
          className={` w-64 bg-gradient-to-b border-r border-border shadow-lg transform transition-transform duration-300 
          ${
            sidebarOpen ? "translate-x-0 hidden md:block" : "-translate-x-full hidden"
          }`}
        >
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div id="main-content" className={`flex-1 flex flex-col
          ${
            sidebarOpen ? "" : ""
          }`}
        >
          <header className="flex items-center justify-between border-b border-border px-3 py-3 bg-header">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="block md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 bg-gradient-to-b from-sidebar-from to-sidebar-to">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SidebarContent onNavClick={() => setMobileMenuOpen(false)} isMobile={true} />
                </SheetContent>
              </Sheet>

              {/* Desktop Sidebar Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="hidden md:block lg:flex"
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <span className="sr-only">{sidebarOpen ? "Hide sidebar" : "Show sidebar"}</span>
              </Button>
            </div>

            <div className="flex items-center gap-4 md:gap-16">
              <div className="relative w-8">
                <ThemeToggle />
              </div>
              <Notifications userId={userData.user_id} userRole={userData.role} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-12 w-12 rounded-full p-0 hover:scale-105 transition-transform focus:ring-2 focus:ring-primary"
                  >
                    <Image
                      src={avatarPath || "/placeholder.svg"}
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
                          src={avatarPath || "/placeholder.svg"}
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
                                src={avatar.path || "/placeholder.svg"}
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
                      className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors bg-transparent"
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
    </SignOutContext.Provider>
  );
}

function NavItem({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-nav-item rounded-md hover:bg-nav-item-hover hover:text-nav-item-hover-foreground transition-all duration-300 hover:pl-6"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}