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
import { UserList } from "@/components/UserList"
import { ChatList } from "@/components/ChatList"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { auth, db } from "@/lib/firebaseConfig"
import HighSchoolSearch from "@/components/HighSchoolSearch"
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs } from "firebase/firestore"

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
  const [creatingUser, setCreatingUser] = useState(false) // New state for create user loading

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

        const response = await fetch("http://127.0.0.1:8080/check-role", {
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

    setCreatingUser(true) // Start loading
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
      const response = await fetch("http://localhost:8080/register", {
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
      setCreatingUser(false) // Stop loading
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

  if (loading) return <p>Loading...</p>

  return (
    <DashboardLayout userType="admin">
      <div className="relative">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        {notification && (
          <div className="mb-4 p-4 bg-gray-100 text-black-800 rounded flex justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-black-600 underline">
              Dismiss
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="flex items-center space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-3xl text-blue-500 transition-transform duration-300 hover:scale-110"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <CardTitle className="text-primary text-xl">Account Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">Create and manage user accounts for the platform.</p>
              <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black hover:bg-gray-200">Create New Account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser}>
                    <div className="grid gap-4 py-4">
                      {dialogError && <div className="p-2 bg-red-100 text-red-800 rounded text-sm">{dialogError}</div>}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="col-span-3"
                          disabled={creatingUser}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="col-span-3"
                          disabled={creatingUser}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="col-span-3"
                          disabled={creatingUser}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="school" className="text-right">
                          School
                        </Label>
                        <HighSchoolSearch onSelect={handleSchoolSelect} Style={"Management"} disabled={creatingUser} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Role
                        </Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                          disabled={creatingUser}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">student</SelectItem>
                            <SelectItem value="instructor">instructor</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={creatingUser}>
                        {creatingUser ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="flex items-center space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-3xl text-green-400 transition-transform duration-300 hover:scale-110"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <CardTitle className="text-primary text-xl">Activity Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">Monitor user activity and system logs.</p>
              <Button
                onClick={() => router.push("/dashboard/admin/logs")}
                className="bg-white text-black hover:bg-gray-200"
              >
                View Activity Logs
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="flex items-center space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-3xl text-purple-400 transition-transform duration-300 hover:scale-110"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6" />
                <path d="M8 18v-1" />
                <path d="M16 18v-3" />
              </svg>
              <CardTitle className="text-primary text-xl">Resource Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">Upload and manage training materials and resources.</p>
              <Button
                onClick={() => router.push("/dashboard/admin/resource-manager")}
                className="bg-white text-black hover:bg-gray-200"
              >
                Upload Training Materials
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">User List</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <Card className="bg-card border border-border rounded-md">
              <CardHeader className="flex items-center space-x-3">
                <CardTitle className="text-primary text-xl">User List</CardTitle>
              </CardHeader>
              <CardContent>
                <UserList key={refreshUserList ? "refresh" : "static"} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="chats">
            <Card>
              <CardHeader>
                <CardTitle>Chat List</CardTitle>
              </CardHeader>
              <CardContent>
                <ChatList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showNotifications && (
          <div className="fixed top-14 right-16 bg-white shadow-lg rounded-md p-4 w-72 z-10">
            <h3 className="font-bold text-lg">Verified User Notifications</h3>
            {verifiedUserNotifications.length > 0 ? (
              <>
                <ul className="mt-2 space-y-2">
                  {verifiedUserNotifications.map((notification) => (
                    <li key={notification.id} className="p-2 bg-gray-100 rounded">
                      <p className="text-sm text-black">New user verified: {notification.email}</p>
                      <p className="text-xs text-gray-500">
                        Name: {notification.name} ({notification.role})
                      </p>
                      <button
                        onClick={() => handleMarkAsRead(notification)}
                        className="mt-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded px-2 py-1"
                      >
                        Mark as Read
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleMarkAllAsRead}
                  className="mt-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded px-2 py-1"
                >
                  Mark All as Read
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No new verified users</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
