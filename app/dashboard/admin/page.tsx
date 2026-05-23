"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserList } from "@/components/UserList"
import { ChatList } from "@/components/ChatList"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { apiUrlBase } from "@/lib/configEnv"
import HighSchoolSearch from "@/components/HighSchoolSearch"
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs } from "firebase/firestore"
import {
  Users,
  FileText,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Layers,
  UserPlus,
  CheckCircle2,
  X,
  AlertCircle,
  Bell,
} from "lucide-react"

// Quick action card component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
  accentColor,
  isDialog,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  buttonText: string
  onClick?: () => void
  accentColor: string
  isDialog?: boolean
  children?: React.ReactNode
}) {
  if (isDialog) {
    return (
      <Card className="group relative overflow-hidden bg-card border border-border rounded-2xl card-hover h-full">
        <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <CardHeader className="relative pb-2">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${accentColor} mb-4`}>
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="relative pt-0">
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{description}</p>
          {children}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden bg-card border border-border rounded-2xl card-hover h-full">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <CardHeader className="relative pb-2">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${accentColor} mb-4`}>
          <Icon className="h-6 w-6 text-foreground" />
        </div>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative pt-0">
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{description}</p>
        <Button
          onClick={onClick}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium"
        >
          {buttonText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | undefined>(undefined)
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "" })
  const [selectedSchool, setSelectedSchool] = useState({ school_name: "", school_id: "" })
  const [verifiedUserCount, setVerifiedUserCount] = useState(0)
  const [verifiedUserNotifications, setVerifiedUserNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [acknowledgedVerifiedUsers, setAcknowledgedVerifiedUsers] = useState<string[]>([])
  const [notification, setNotification] = useState<string | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [refreshUserList, setRefreshUserList] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)

  const handleSchoolSelect = (name: string, placeId: any) => {
    setSelectedSchool({ school_name: name, school_id: placeId })
    console.log("Selected School:", name, "Place ID:", placeId)
  }

  // Lock navigation
  useEffect(() => {
    const preventNavigation = (e: PopStateEvent) => {
      console.log("Navigation attempt blocked in AdminDashboard")
      e.preventDefault()
      window.history.pushState(null, "", window.location.pathname)
    }
    window.history.pushState(null, "", window.location.pathname)
    window.addEventListener("popstate", preventNavigation)
    return () => window.removeEventListener("popstate", preventNavigation)
  }, [])

  // Auth state listener for admin only
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged triggered, user:", user?.uid, "current admin userId:", userId)
      if (user) {
        const uid = user.uid
        if (!userId) setUserId(uid)
        const token = await user.getIdToken()

        const response = await fetch(`${apiUrlBase}/check-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        })
        const data = await response.json()

        if (data.role !== "admin" && uid === userId) {
          router.push(`/dashboard/${data.role}`)
        } else if (data.role === "admin") {
          setUserRole(data.role)
          const userRef = doc(db, "users", uid)
          const userDoc = await getDoc(userRef)
          if (userDoc.exists()) {
            setAcknowledgedVerifiedUsers(userDoc.data().acknowledgedVerifiedUsers || [])
          }
        }
      } else if (!user && userId) {
        router.push("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, userId])

  // Fetch verified users
  useEffect(() => {
    if (!userRole || userRole !== "admin" || !userId) return

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("verified", "==", true))

    const unsubscribeQuery = onSnapshot(
      q,
      (snapshot) => {
        const verifiedUsers: any[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          const id = doc.id
          if (!acknowledgedVerifiedUsers.includes(id) && !verifiedUsers.some((u) => u.id === id)) {
            verifiedUsers.push({ id, email: data.email, name: data.name, role: data.role })
          }
        })
        setVerifiedUserCount(verifiedUsers.length)
        setVerifiedUserNotifications(verifiedUsers)
      },
      (error) => console.error("Error fetching verified users:", error),
    )

    return () => unsubscribeQuery()
  }, [userRole, userId, acknowledgedVerifiedUsers])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Step 1: Form submission prevented")

    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role || !selectedSchool.school_name) {
      setDialogError("Please fill out all required fields")
      console.log("Step 2: Validation failed")
      return
    }

    setCreatingUser(true)
    try {
      console.log("Step 3: Checking if email already exists")

      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", newUser.email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        setDialogError("Error: use client - This email is already in use.")
        console.log("Step 4: Email already exists")
        return
      }

      console.log("Step 5: Creating Firebase user")
      const currentUser = auth.currentUser
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
      const user = userCredential.user
      console.log("Step 6: Firebase user created, UID:", user.uid)

      console.log("Step 7: Sending verification email")
      await sendEmailVerification(user)
      console.log("Step 8: Verification email sent")

      if (currentUser) {
        await auth.updateCurrentUser(currentUser)
      }

      console.log("Step 9: Registering with backend")
      const response = await fetch(`${apiUrlBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uid,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          school_name: selectedSchool.school_name,
          school_id: selectedSchool.school_id,
        }),
      })
      console.log("Step 10: Backend response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Backend registration failed: ${errorText}`)
      }

      const data = await response.json()
      console.log("Step 11: User registered successfully:", data)

      setNotification("Account created successfully. A verification email has been sent to the user.")
      setIsCreateUserDialogOpen(false)
      setNewUser({ name: "", email: "", password: "", role: "" })
      setSelectedSchool({ school_name: "", school_id: "" })
      setDialogError(null)
      setRefreshUserList((prev) => !prev)
      console.log("Step 12: Form reset, dialog closed, user list refresh triggered")
    } catch (error: any) {
      console.error("Error creating user:", error.message)
      let errorMessage = "Error: Please try again."
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Error: use client - This email is already in use."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Error: Invalid email format."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Error: Password must be at least 6 characters."
      } else {
        errorMessage = `Error: ${error.message}`
      }
      setDialogError(errorMessage)
      console.log("Step 13: Error handled")
    } finally {
      setCreatingUser(false)
    }
  }

  const handleBellClick = () => setShowNotifications((prev) => !prev)
  const handleMarkAsRead = async (notification: any) => {
    const updatedList = [...acknowledgedVerifiedUsers, notification.id]
    setAcknowledgedVerifiedUsers(updatedList)
    if (userId) {
      const userRef = doc(db, "users", userId)
      try {
        await updateDoc(userRef, { acknowledgedVerifiedUsers: updatedList })
      } catch (error) {
        console.error("Error updating Firestore:", error)
        setAcknowledgedVerifiedUsers(acknowledgedVerifiedUsers)
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    const allVerifiedUserIds = verifiedUserNotifications.map((n) => n.id)
    const updatedList = [...acknowledgedVerifiedUsers, ...allVerifiedUserIds]
    setAcknowledgedVerifiedUsers(updatedList)
    if (userId) {
      const userRef = doc(db, "users", userId)
      try {
        await updateDoc(userRef, { acknowledgedVerifiedUsers: updatedList })
      } catch (error) {
        console.error("Error updating Firestore:", error)
        setAcknowledgedVerifiedUsers(acknowledgedVerifiedUsers)
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userType="admin">
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Admin Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">System Management</h1>
          <p className="text-muted-foreground">Manage users, resources, and monitor system activity.</p>
        </div>

        {/* Success Notification */}
        {notification && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-green-700 dark:text-green-300">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Quick Actions Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Account Management Card */}
            <QuickActionCard
              icon={Users}
              title="Account Management"
              description="Create and manage user accounts for the platform."
              buttonText="Create New Account"
              accentColor="from-blue-500/10 to-blue-600/5"
              isDialog
            >
              <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Create New User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser}>
                    <div className="grid gap-4 py-4">
                      {dialogError && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">{dialogError}</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="rounded-xl"
                          placeholder="Enter full name"
                          disabled={creatingUser}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="rounded-xl"
                          placeholder="Enter email address"
                          disabled={creatingUser}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="rounded-xl"
                          placeholder="Enter password"
                          disabled={creatingUser}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="school" className="text-sm font-medium">
                          School
                        </Label>
                        <HighSchoolSearch onSelect={handleSchoolSelect} Style={"Management"} disabled={creatingUser} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium">
                          Role
                        </Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                          disabled={creatingUser}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={creatingUser}
                        className="w-full rounded-xl bg-primary hover:bg-primary/90"
                      >
                        {creatingUser ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          "Create User"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </QuickActionCard>

            {/* Activity Monitoring Card */}
            <QuickActionCard
              icon={FileText}
              title="Activity Monitoring"
              description="Monitor user activity and system logs."
              buttonText="View Activity Logs"
              onClick={() => router.push("/dashboard/admin/logs")}
              accentColor="from-emerald-500/10 to-emerald-600/5"
            />

            {/* Resource Management Card */}
            <QuickActionCard
              icon={FolderOpen}
              title="Resource Management"
              description="Upload and manage training materials and resources."
              buttonText="Upload Materials"
              onClick={() => router.push("/dashboard/admin/resource-manager")}
              accentColor="from-violet-500/10 to-violet-600/5"
            />
          </div>
        </section>

        {/* User List Section */}
        <section className="mb-8">
          <Card className="bg-card border border-border rounded-2xl overflow-hidden">
            <Tabs defaultValue="users" className="w-full">
              <CardHeader className="border-b border-border bg-secondary/30 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">User Management</CardTitle>
                      <p className="text-sm text-muted-foreground">View and manage all platform users</p>
                    </div>
                  </div>
                  <TabsList className="bg-secondary/50 rounded-xl p-1">
                    <TabsTrigger value="users" className="rounded-lg px-4">
                      User List
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <TabsContent value="users" className="mt-0">
                  <UserList key={refreshUserList ? "refresh" : "static"} />
                </TabsContent>
                <TabsContent value="chats" className="mt-0">
                  <ChatList />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </section>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="fixed top-20 right-6 bg-card border border-border shadow-2xl rounded-2xl p-5 w-80 z-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Verified Users</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {verifiedUserNotifications.length > 0 ? (
              <>
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {verifiedUserNotifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="p-3 bg-secondary/50 rounded-xl border border-border"
                    >
                      <p className="text-sm font-medium text-foreground">{notification.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.name} - <Badge variant="outline" className="text-xs">{notification.role}</Badge>
                      </p>
                      <button
                        onClick={() => handleMarkAsRead(notification)}
                        className="mt-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Mark as Read
                      </button>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleMarkAllAsRead}
                  className="w-full mt-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                  variant="ghost"
                >
                  Mark All as Read
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No new verified users</p>
            )}
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}
