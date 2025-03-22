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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from "next/image"
import { auth, db } from '@/lib/firebaseConfig';
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: "admin" | "instructor" | "student"
}

const getUser = () => {
  return JSON.parse(localStorage.getItem('user') || 'null')
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const userData = getUser();
  const router = useRouter();

  const avatarOptions = [
    "https://api.dicebear.com/9.x/bottts/png?seed=CanSat",
    "https://api.dicebear.com/9.x/bottts/png?seed=Satellite",
    "https://api.dicebear.com/9.x/bottts/png?seed=Orbit",
    "https://api.dicebear.com/9.x/bottts/png?seed=Launch",
  ];
  
  const [avatarUrl, setAvatarUrl] = useState(avatarOptions[0]);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  if (!userData) return <p>Loading...</p>;

  useEffect(() => {
    const fetchAvatar = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data()?.avatarUrl) {
          setAvatarUrl(userDoc.data().avatarUrl);
        }
      }
    };
    fetchAvatar();
  }, []);

  const handleAvatarSelect = async (selectedAvatar: string) => {
    if (!auth.currentUser) return;

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, { avatarUrl: selectedAvatar }, { merge: true });
      setAvatarUrl(selectedAvatar);
      setShowAvatarOptions(false);
    } catch (error) {
      console.error("Error saving avatar selection:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        console.warn("No ID token available, proceeding with local sign-out");
      } else {
        const response = await fetch("http://localhost:8080/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Logout request failed: ${response.status} - ${errorText}`);
        } else {
          console.log("Logout logged successfully:", await response.json());
        }
      }

      await signOut(auth);
      localStorage.removeItem("user");
      console.log("User signed out successfully!");
      router.push("/");
    } catch (error: any) {
      console.error("Error during sign-out process:", error.message);
      // Proceed with sign-out even if backend call fails
      await signOut(auth);
      localStorage.removeItem("user");
      router.push("/");
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r">
        <div className="p-4">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push(`/dashboard/${userData.role}`)}>
            CanSat Educational Tool
          </h1>
        </div>
        <nav className="space-y-1 px-2">
          {userType === "admin" && (
            <>
              <NavItem href="/admin/accounts" icon={<User className="h-4 w-4" />}>Account Management</NavItem>
              <NavItem href="/admin/activity" icon={<ActivityIcon className="h-4 w-4" />}>Activity Monitoring</NavItem>
            </>
          )}
          {userType === "instructor" && (
            <>
              <NavItem href="/instructor/materials" icon={<FolderIcon className="h-4 w-4" />}>Access Materials</NavItem>
              <NavItem href="/instructor/time-tracking" icon={<ClockIcon className="h-4 w-4" />}>Time Tracking</NavItem>
              <NavItem href="/instructor/communication" icon={<MessageSquareIcon className="h-4 w-4" />}>Student Communication</NavItem>
            </>
          )}
          {userType === "student" && (
            <>
              <NavItem href="student/training-materials" icon={<BookOpenIcon className="h-4 w-4" />}>Access Resources</NavItem>
              <NavItem href="ide" icon={<CodeIcon className="h-4 w-4" />}>Virtual Arduino IDE</NavItem>
              <NavItem href="/student/collaboration" icon={<UsersIcon className="h-4 w-4" />}>Collaboration Tools</NavItem>
              <NavItem href="/student/messages" icon={<MessageCircleIcon className="h-4 w-4" />}>Direct Messaging</NavItem>
            </>
          )}
        </nav>
      </div>

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
                    src={avatarUrl}
                    alt="User Avatar"
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
                        src={avatarUrl}
                        alt="User Avatar"
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
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                    >
                      {showAvatarOptions ? "Hide Avatars" : "Edit Avatar"}
                    </Button>
                    {showAvatarOptions && (
                      <div className="grid grid-cols-4 gap-2">
                        {avatarOptions.map((avatar) => (
                          <button
                            key={avatar}
                            onClick={() => handleAvatarSelect(avatar)}
                            className={`p-1 rounded-full ${avatarUrl === avatar ? "ring-2 ring-blue-500" : ""}`}
                          >
                            <Image
                              src={avatar}
                              alt="Avatar Option"
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
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