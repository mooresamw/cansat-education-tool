"use client";

import type React from "react";
import { useEffect, useRef, useState, createContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { apiUrlBase } from "@/lib/configEnv";
import {
  ActivityIcon,
  BookOpenIcon,
  CodeIcon,
  FolderIcon,
  FolderOpenIcon,
  LogOut,
  MessageSquareIcon,
  UsersIcon,
  Settings,
  Search,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Home,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Notifications } from "@/components/Notifications";
import { LaikaChat } from "@/components/LaikaChat";
import { LaikaPageContextProvider } from "@/components/LaikaPageContext";

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

interface SidebarContentProps {
  userData: any;
  avatarPath: string;
  avatarSeed: number;
  showAvatarPicker: boolean;
  setShowAvatarPicker: React.Dispatch<React.SetStateAction<boolean>>;
  handleAvatarChange: (index: number) => void;
  handleSignOut: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchResults: SearchItem[];
  showSearchResults: boolean;
  handleSearchItemClick: (item: SearchItem) => void;
  handleSearchKeyDown: (e: React.KeyboardEvent) => void;
  clearSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  pathname: string;
  onNavClick?: () => void;
  isMobile?: boolean;
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
    keywords: ["messages", "collaboration", "tools", "student", "teamwork", "group", "peers"],
  },
  {
    title: "Settings",
    href: "/dashboard/{role}/settings",
    icon: <Settings className="h-4 w-4" />,
    roles: ["admin", "instructor", "student"],
    keywords: ["settings", "preferences", "configuration", "profile", "account"],
  },
  {
    title: "Dashboard",
    href: "/dashboard/{role}",
    icon: <Home className="h-4 w-4" />,
    roles: ["admin", "instructor", "student"],
    keywords: ["home", "dashboard", "back"],
  },
];

function SidebarContent({
  userData,
  avatarPath,
  avatarSeed,
  showAvatarPicker,
  setShowAvatarPicker,
  handleAvatarChange,
  handleSignOut,
  searchQuery,
  setSearchQuery,
  searchResults,
  showSearchResults,
  handleSearchItemClick,
  handleSearchKeyDown,
  clearSearch,
  searchInputRef,
  pathname,
  onNavClick,
  isMobile = false,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-border/50">
        <Link
          href={`/dashboard/${userData.role}`}
          className="flex items-center gap-3 group"
          onClick={onNavClick}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight">Avakas</span>
            <span className="text-xs text-muted-foreground">Cansat Education Tool</span>
          </div>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={isMobile ? undefined : searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full h-10 rounded-xl bg-secondary/50 border-0 pl-10 pr-10 text-base md:text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">No results found</div>
              ) : (
                searchResults.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchItemClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      {item.icon}
                    </div>
                    <span className="flex-1 font-medium">{item.title}</span>
                    <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
                      {userData.role}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        <div className="mb-2 px-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Menu
          </span>
        </div>

        {/* Dashboard Home */}
        <NavItem
          href={`/dashboard/${userData.role}`}
          icon={<Home className="h-4 w-4" />}
          onClick={onNavClick}
          isActive={pathname === `/dashboard/${userData.role}`}
        >
          Dashboard
        </NavItem>

        {userData.role === "admin" && (
          <>
            <NavItem
              href="/dashboard/admin/logs"
              icon={<ActivityIcon className="h-4 w-4" />}
              onClick={onNavClick}
              isActive={pathname.includes("/admin/logs")}
            >
              Activity Monitoring
            </NavItem>
            <NavItem
              href="/dashboard/admin/resource-manager"
              icon={<FolderOpenIcon className="h-4 w-4" />}
              onClick={onNavClick}
              isActive={pathname.includes("/resource-manager")}
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
              isActive={pathname.includes("/training-materials")}
            >
              Access Materials
            </NavItem>
            <NavItem
              href="/dashboard/instructor/message"
              icon={<MessageSquareIcon className="h-4 w-4" />}
              onClick={onNavClick}
              isActive={pathname.includes("/instructor/message")}
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
              isActive={pathname.includes("/training-materials")}
            >
              Access Resources
            </NavItem>
            <NavItem
              href="/dashboard/student/ide"
              icon={<CodeIcon className="h-4 w-4" />}
              onClick={onNavClick}
              isActive={pathname.includes("/ide")}
            >
              Virtual Arduino IDE
            </NavItem>

            {/*NOTE TO HUMANS AND AGENTS: KEEP THIS COMMENTED SECTION*/}
            {/*<NavItem*/}
            {/*  href="/dashboard/student/messages"*/}
            {/*  icon={<UsersIcon className="h-4 w-4" />}*/}
            {/*  onClick={onNavClick}*/}
            {/*  isActive={pathname.includes("/messages")}*/}
            {/*>*/}
            {/*  */}
            {/*</NavItem>*/}
          </>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto border-t border-border/50 p-3 space-y-1">
        <NavItem
          href={`/dashboard/${userData.role}/settings`}
          icon={<Settings className="h-4 w-4" />}
          onClick={onNavClick}
          isActive={pathname.includes("/settings")}
        >
          Settings
        </NavItem>

        {/* User Profile Card */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-all duration-200 group">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl overflow-hidden ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
                  <Image
                    src={avatarPath || "/placeholder.svg"}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/avatars/avatar1.png";
                    }}
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{userData.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{userData.role}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 bg-card border border-border shadow-2xl rounded-2xl p-0 overflow-hidden"
            side="right"
            align="end"
            sideOffset={8}
          >
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl overflow-hidden ring-4 ring-background shadow-lg">
                  <Image
                    src={avatarPath || "/placeholder.svg"}
                    alt="User Avatar"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/avatars/avatar1.png";
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{userData.name}</h2>
                  <Badge className="bg-primary/10 text-primary border-0 font-medium capitalize">
                    {userData.role}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAvatarPicker((prev) => !prev)}
                className="w-full justify-center rounded-xl h-10 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {showAvatarPicker ? "Close Avatar Picker" : "Change Avatar"}
              </Button>

              {showAvatarPicker && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Select Your Avatar</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LOCAL_AVATARS.map((avatar, index) => (
                      <button
                        key={avatar.id}
                        onClick={() => handleAvatarChange(index)}
                        className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${
                          avatarSeed === index + 1
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-105"
                            : "hover:ring-2 hover:ring-primary/50 hover:scale-105"
                        }`}
                      >
                        <Image
                          src={avatar.path || "/placeholder.svg"}
                          alt={`${avatar.id} avatar`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/avatars/avatar1.png";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Email:</span> {userData.email}
                </p>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-center rounded-xl h-10 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [userData, setUserData] = useState<any>(null);
  const [avatarSeed, setAvatarSeed] = useState<number>(1);
  const [mounted, setMounted] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    setShowSearchResults(true);
  }, [searchQuery, userData]);

  // Handle search item selection
  const handleSearchItemClick = (item: SearchItem) => {
    setSearchQuery("");
    setShowSearchResults(false);
    setMobileMenuOpen(false);

    const resolvedHref = item.href.replace("{role}", userData.role);
    if (pathname === resolvedHref) {
      const element = document.querySelector(`[data-search-target="${item.title.toLowerCase().replace(/\s+/g, "-")}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      router.push(resolvedHref);
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
          const response = await fetch(`${apiUrlBase}/user/avatar`, {
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
              setAvatarSeed(backendSeed);
              const updatedUser = { ...userData, avatarSeed: backendSeed };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setUserData(updatedUser);
            }
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
      const response = await fetch(`${apiUrlBase}/user/avatar`, {
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

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const user = auth.currentUser;
      let token: string | null = null;

      if (user) {
        token = await user.getIdToken();
      }

      if (token) {
        try {
          const logoutResponse = await fetch(`${apiUrlBase}/logout`, {
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

      await signOut(auth);
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      router.push("/login");
    } catch (error: any) {
      console.error("Error signing out:", error.message);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const avatarPath = LOCAL_AVATARS[(avatarSeed || 1) - 1]?.path || LOCAL_AVATARS[0].path;

  // Get current page title based on pathname
  const getPageTitle = () => {
    if (pathname.includes("/logs")) return "Activity Monitoring";
    if (pathname.includes("/resource-manager")) return "Resource Management";
    if (pathname.includes("/training-materials")) return "Training Materials";
    if (pathname.includes("/ide")) return "Virtual Arduino IDE";
    if (pathname.includes("/message")) return "Messages";
    if (pathname.includes("/settings")) return "Settings";
    return "Dashboard";
  };

  return (
    <SignOutContext.Provider value={{ isSigningOut, setIsSigningOut }}>
      <LaikaPageContextProvider>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-[280px] bg-card border-r border-border/50 shadow-xl transform transition-transform duration-300 ease-out hidden md:flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            userData={userData}
            avatarPath={avatarPath}
            avatarSeed={avatarSeed}
            showAvatarPicker={showAvatarPicker}
            setShowAvatarPicker={setShowAvatarPicker}
            handleAvatarChange={handleAvatarChange}
            handleSignOut={handleSignOut}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            handleSearchItemClick={handleSearchItemClick}
            handleSearchKeyDown={handleSearchKeyDown}
            clearSearch={clearSearch}
            searchInputRef={searchInputRef}
            pathname={pathname}
          />
        </aside>

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-out ${
            sidebarOpen ? "md:ml-[280px]" : "md:ml-0"
          }`}
        >
          {/* Top Bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 md:px-6 bg-card/80 backdrop-blur-xl border-b border-border/50">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 border-r-0">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SidebarContent
                    userData={userData}
                    avatarPath={avatarPath}
                    avatarSeed={avatarSeed}
                    showAvatarPicker={showAvatarPicker}
                    setShowAvatarPicker={setShowAvatarPicker}
                    handleAvatarChange={handleAvatarChange}
                    handleSignOut={handleSignOut}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    showSearchResults={showSearchResults}
                    handleSearchItemClick={handleSearchItemClick}
                    handleSearchKeyDown={handleSearchKeyDown}
                    clearSearch={clearSearch}
                    searchInputRef={searchInputRef}
                    pathname={pathname}
                    onNavClick={() => setMobileMenuOpen(false)}
                    isMobile={true}
                  />
                </SheetContent>
              </Sheet>

              {/* Desktop Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hidden md:flex h-10 w-10 rounded-xl hover:bg-secondary/50"
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Button>

              {/* Page Title */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Theme Toggle */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary/50 transition-colors">
                <ThemeToggle />
              </div>

              {/* Notifications */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary/50 transition-colors">
                <Notifications userId={userData.user_id} userRole={userData.role} />
              </div>

              {/* User Avatar - Header */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 rounded-xl p-0 hover:bg-secondary/50 overflow-hidden ring-2 ring-border/50 hover:ring-primary/30 transition-all"
                  >
                    <Image
                      src={avatarPath || "/placeholder.svg"}
                      alt="User Avatar"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/avatars/avatar1.png";
                      }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-72 bg-card border border-border shadow-2xl rounded-2xl p-0 overflow-hidden"
                  align="end"
                  sideOffset={8}
                >
                  <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden ring-4 ring-background shadow-lg">
                        <Image
                          src={avatarPath || "/placeholder.svg"}
                          alt="User Avatar"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/avatars/avatar1.png";
                          }}
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{userData.name}</h2>
                        <Badge className="bg-primary/10 text-primary border-0 font-medium capitalize">
                          {userData.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="w-full justify-center rounded-xl h-10 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      {showAvatarPicker ? "Close Avatar Picker" : "Change Avatar"}
                    </Button>

                    {showAvatarPicker && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Select Your Avatar</p>
                        <div className="grid grid-cols-3 gap-2">
                          {LOCAL_AVATARS.map((avatar, index) => (
                            <button
                              key={avatar.id}
                              onClick={() => handleAvatarChange(index)}
                              className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${
                                avatarSeed === index + 1
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-105"
                                  : "hover:ring-2 hover:ring-primary/50 hover:scale-105"
                              }`}
                            >
                              <Image
                                src={avatar.path || "/placeholder.svg"}
                                alt={`${avatar.id} avatar`}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/avatars/avatar1.png";
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="py-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Email:</span> {userData.email}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full justify-center rounded-xl h-10 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
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

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>

          {/* Laika Chat Floating Widget */}
          <LaikaChat />
        </div>
      </div>
      </LaikaPageContextProvider>
    </SignOutContext.Provider>
  );
}

function NavItem({
  href,
  icon,
  children,
  onClick,
  isActive = false,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 group ${
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        isActive 
          ? "bg-primary-foreground/20" 
          : "bg-secondary group-hover:bg-secondary"
      }`}>
        {icon}
      </div>
      <span>{children}</span>
    </Link>
  );
}
