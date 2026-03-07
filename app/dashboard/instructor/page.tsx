"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { checkUserRole } from "@/lib/checkAuth"
import { useRouter } from "next/navigation"
import { db, auth, getStudents } from "@/lib/firebaseConfig"
import { collection, doc, setDoc, onSnapshot, where, query } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { markMessageAsRead } from "@/lib/firestoreUtil"
import { StudentProgressTable } from "@/components/StudentProgressTable"
import {
  BookOpen,
  Clock,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Layers,
  Play,
  Pause,
  History,
  X,
  Bell,
  ExternalLink,
  Timer,
} from "lucide-react"

interface ClockHistoryEntry {
  action: "in" | "out"
  timestamp: string
  clockInTimestamp?: string
  duration?: number
}

// Quick action card component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
  accentColor,
  secondaryButton,
  statusContent,
}: {
  icon: React.ElementType
  title: string
  description: string
  buttonText: string
  onClick?: () => void
  accentColor: string
  secondaryButton?: { text: string; onClick: () => void }
  statusContent?: React.ReactNode
}) {
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
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{description}</p>
        {statusContent && <div className="mb-4">{statusContent}</div>}
        <div className="flex gap-2">
          <Button
            onClick={onClick}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium"
          >
            {buttonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {secondaryButton && (
            <Button
              onClick={secondaryButton.onClick}
              variant="outline"
              className="rounded-xl border-border hover:bg-secondary"
            >
              <History className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function InstructorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | undefined>(undefined)
  const [studentUnreadCount, setStudentUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockHistory, setClockHistory] = useState<ClockHistoryEntry[]>([])
  const [showClockHistory, setShowClockHistory] = useState(false)
  const [currentSessionDuration, setCurrentSessionDuration] = useState(0)

  // Fetch authenticated user and role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid
        setUserId(uid)
        const token = await user.getIdToken()
        console.log("Firebase Token:", token)
        const response = await fetch("http://localhost:8080/check-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        })
        const data = await response.json()
        if (data.role === "student") {
          router.push("/dashboard/student/")
        } else {
          setUserRole(data.role)
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const students = await getStudents()
        const ids = students.map((student: any) => student.user_id)
        setStudentIds(ids)
        console.log("Student IDs:", ids)
      } catch (error) {
        console.error("Error fetching students:", error)
      }
    }

    fetchStudents()
  }, [])

  // Fetch notifications
  useEffect(() => {
    if (!userRole || userRole !== "instructor") {
      console.log("User role is not instructor or not authenticated:", userRole)
      return
    }

    if (!userId) {
      console.log("No userId available yet")
      return
    }

    if (studentIds.length === 0) {
      console.log("Student IDs not yet loaded")
      return
    }

    const messagesRef = collection(db, "messages")
    const q = query(messagesRef, where("participants", "array-contains", userId))

    const unsubscribeQuery = onSnapshot(
      q,
      (snapshot) => {
        let studentUnread = 0
        const studentMessages: any[] = []
        const allMessages: any[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          const conversationId = doc.id
          const messages = data.messages || []
          const otherParticipants = data.participants.filter((id: string) => id !== userId)
          const involvesStudent = otherParticipants.some((id: string) => studentIds.includes(id))

          messages.forEach((msg: any) => {
            const readStatus = msg.read || {}
            const isUnread = msg.sender !== userId && readStatus[userId] !== true

            if (isUnread) {
              const messageData = {
                message: msg.message,
                sender: msg.sender,
                timestamp: msg.timestamp,
                messageId: msg.messageId,
                participants: data.participants,
                conversationId: conversationId,
                involvesStudent,
              }

              allMessages.push(messageData)

              if (involvesStudent) {
                studentUnread++
                studentMessages.push(messageData)
              }
            }
          })
        })

        console.log("Student Unread Count:", studentUnread)
        console.log("Student Unread Messages:", studentMessages)
        console.log("All Unread Messages:", allMessages)

        setStudentUnreadCount(studentUnread)
        setNotifications(allMessages)
      },
      (error) => {
        console.error("Error in onSnapshot Query:", error)
      },
    )

    return () => unsubscribeQuery()
  }, [userRole, userId, studentIds])

  // Fetch clock-in/out history
  useEffect(() => {
    if (!userId) return

    const clockDocRef = doc(db, "clockHistory", userId)

    const unsubscribe = onSnapshot(clockDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const history: ClockHistoryEntry[] = data.entries || []
        setClockHistory(history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))

        const lastEntry = history[0]
        if (lastEntry && lastEntry.action === "in" && !lastEntry.clockOutTimestamp) {
          setIsClockedIn(true)
          const startTime = new Date(lastEntry.timestamp)
          const now = new Date()
          setCurrentSessionDuration(Math.floor((now.getTime() - startTime.getTime()) / 1000))
        } else {
          setIsClockedIn(false)
          setCurrentSessionDuration(0)
        }
      } else {
        setClockHistory([])
        setIsClockedIn(false)
        setCurrentSessionDuration(0)
      }
    })

    return () => unsubscribe()
  }, [userId])

  // Update current session duration every second if clocked in
  useEffect(() => {
    if (!isClockedIn) return

    const interval = setInterval(() => {
      setCurrentSessionDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isClockedIn])

  // Handle Clock In/Out
  const handleClockAction = async () => {
    if (!userId) {
      console.error("No userId available for clock action")
      return
    }

    const action = isClockedIn ? "out" : "in"
    const token = await auth.currentUser?.getIdToken()

    try {
      const response = await fetch("https://cansat-education-tool.onrender.com/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token, action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to clock ${action}: ${await response.text()}`)
      }

      const data = await response.json()
      console.log(`Clock ${action} successful:`, data)

      setIsClockedIn(!isClockedIn)
    } catch (error) {
      console.error(`Error during clock ${action}:`, error)
    }
  }

  // Format duration in hours, minutes, seconds
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs}h ${mins}m ${secs}s`
  }

  // Notification handlers
  const handleBellClick = () => setShowNotifications((prev) => !prev)

  const handleMarkAsRead = async (notification: any) => {
    if (!userId) {
      console.error("No userId available to mark message as read")
      return
    }

    try {
      const { conversationId, messageId } = notification
      if (!conversationId || !messageId) {
        console.error("Missing conversationId or messageId in notification data")
        return
      }

      await markMessageAsRead(userId, conversationId, messageId)
      console.log(`Marked message ${messageId} as read for user ${userId}`)
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  // Handle opening clock history in a new tab
  const handleViewHistoryInNewTab = () => {
    const newWindow = window.open("", "_blank")
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Clock-In/Out History</title>
            <style>
              body { background-color: #0a0a0a; color: #fafafa; font-family: system-ui, -apple-system, sans-serif; padding: 40px; }
              h1 { font-size: 24px; margin-bottom: 24px; }
              table { width: 100%; border-collapse: collapse; background: #171717; border-radius: 12px; overflow: hidden; }
              th, td { padding: 16px; text-align: left; border-bottom: 1px solid #262626; }
              th { background-color: #1f1f1f; font-weight: 600; color: #a1a1aa; }
              tr:last-child td { border-bottom: none; }
              .close-btn { background: linear-gradient(to right, #3b82f6, #2563eb); color: #fff; padding: 12px 24px; border: none; cursor: pointer; border-radius: 12px; font-weight: 500; margin-top: 24px; }
              .close-btn:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <h1>Clock-In/Out History</h1>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock-In</th>
                  <th>Clock-Out</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${clockHistory
                  .filter((entry) => entry.action === "out")
                  .map((entry) => {
                    const clockInTime = new Date(entry.clockInTimestamp || "")
                    const clockOutTime = new Date(entry.timestamp)
                    return `
                      <tr>
                        <td>${clockInTime?.toLocaleDateString()}</td>
                        <td>${clockInTime?.toLocaleTimeString()}</td>
                        <td>${clockOutTime?.toLocaleTimeString()}</td>
                        <td>${entry.duration ? formatDuration(entry.duration) : "N/A"}</td>
                      </tr>
                    `
                  })
                  .join("")}
              </tbody>
            </table>
            <button class="close-btn" onclick="window.close()">Close Tab</button>
          </body>
        </html>
      `)
      newWindow.document.close()
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
    <div className="bg-background min-h-screen">
      <DashboardLayout userType="instructor">
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Instructor Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Manage your students and track their progress.</p>
          </div>

          {/* Quick Actions Grid */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Access Materials Card */}
              <QuickActionCard
                icon={BookOpen}
                title="Access Materials"
                description="View and manage training resources for your students."
                buttonText="View Resources"
                onClick={() => router.push("/dashboard/student/training-materials")}
                accentColor="from-blue-500/10 to-blue-600/5"
              />

              {/* Time Tracking Card */}
              <QuickActionCard
                icon={Clock}
                title="Time Tracking"
                description="Track your time spent on instruction and support."
                buttonText={isClockedIn ? "Clock Out" : "Clock In"}
                onClick={handleClockAction}
                accentColor="from-emerald-500/10 to-emerald-600/5"
                secondaryButton={{ text: "History", onClick: () => setShowClockHistory(true) }}
                statusContent={
                  isClockedIn && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <Timer className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {formatDuration(currentSessionDuration)}
                      </span>
                    </div>
                  )
                }
              />

              {/* Student Communication Card */}
              <QuickActionCard
                icon={MessageSquare}
                title="Student Communication"
                description="Communicate directly with your students."
                buttonText="Open Chat"
                onClick={() => router.push("/dashboard/instructor/message")}
                accentColor="from-violet-500/10 to-violet-600/5"
              />
            </div>
          </section>

          {/* Student Progress Section */}
          <section className="mb-8">
            <Card className="bg-card border border-border rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border bg-secondary/30 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10">
                    <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">Student Progress</CardTitle>
                    <p className="text-sm text-muted-foreground">Track your students learning progress</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <StudentProgressTable />
              </CardContent>
            </Card>
          </section>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="fixed top-20 right-6 bg-card border border-border shadow-2xl rounded-2xl p-5 w-80 z-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Unread Messages</h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {notifications.length > 0 ? (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <li key={index} className="p-3 bg-secondary/50 rounded-xl border border-border">
                      <p className="text-sm text-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {notification.sender}{" "}
                        <Badge variant="outline" className="text-xs ml-1">
                          Student
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
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
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No unread messages</p>
              )}
            </div>
          )}

          {/* Clock History Modal */}
          {showClockHistory && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <Card className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 overflow-hidden">
                <CardHeader className="border-b border-border bg-secondary/30 py-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                        <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-foreground">Clock History</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleViewHistoryInNewTab}
                        variant="outline"
                        className="rounded-xl border-border hover:bg-secondary"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        New Tab
                      </Button>
                      <Button
                        onClick={() => setShowClockHistory(false)}
                        variant="outline"
                        className="rounded-xl border-border hover:bg-secondary"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {clockHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Clock-In</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Clock-Out</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clockHistory.map((entry, index) => {
                            if (entry.action === "out") {
                              const clockInTime = new Date(entry.clockInTimestamp || "")
                              const clockOutTime = new Date(entry.timestamp)
                              return (
                                <tr key={index} className="border-b border-border last:border-0">
                                  <td className="py-3 px-4 text-sm text-foreground">
                                    {clockInTime?.toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-foreground">
                                    {clockInTime?.toLocaleTimeString()}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-foreground">
                                    {clockOutTime?.toLocaleTimeString()}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-foreground">
                                    <Badge variant="outline" className="font-mono">
                                      {entry.duration ? formatDuration(entry.duration) : "N/A"}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            }
                            return null
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No clock history available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </DashboardLayout>
    </div>
  )
}
