"use client"

import { useEffect, useState, useContext } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { checkUserRole } from "@/lib/checkAuth"
import { apiUrlBase } from "@/lib/configEnv";
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db, auth, getInstructors } from "@/lib/firebaseConfig"
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  BookOpen,
  Cpu,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  Target,
  Layers,
  X,
} from "lucide-react"
import { markMessageAsRead } from "@/lib/firestoreUtil"
import { SignOutContext } from "@/components/DashboardLayout"
import { LAIKA_TOGGLE_EVENT } from "@/components/LaikaChat"

interface ProgressItem {
  accessed_at: string
  completed: boolean
  completion_date: string
  material_id: string
  title: string
  type: string
}

interface GroupMember {
  name: string
  user_id: string
  joined_at: any
}

interface Group {
  id: string
  name: string
  members: GroupMember[]
  instructor_email: string
  school_id: string
  created_by: string
  created_at: any
}

interface MemberProgress {
  user_id: string
  name?: string
  email?: string
  recentProgress?: ProgressItem
  totalCompleted: number
}

// Quick action card component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
  href,
  accentColor,
}: {
  icon: React.ElementType
  title: string
  description: string
  buttonText: string
  onClick?: () => void
  href?: string
  accentColor: string
}) {
  const content = (
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

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>
  }
  return content
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accentColor: string
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${accentColor}`}>
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

// Team member card component
function TeamMemberCard({
  member,
  isCurrentUser,
}: {
  member: MemberProgress
  isCurrentUser: boolean
}) {
  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
          {member.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">{member.name}</p>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                You
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{member.totalCompleted} completed</p>
        </div>
      </div>

      {member.recentProgress ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Latest completion</p>
          <div className="p-3 rounded-lg bg-card border border-border">
            <p className="text-sm font-medium text-foreground mb-1 truncate">
              {member.recentProgress.title.replace("pdfs/", "").replace(".pdf", "")}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(member.recentProgress.completion_date).toLocaleDateString()}
              </span>
              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Done
              </Badge>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No completions yet</p>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const { isSigningOut } = useContext(SignOutContext)
  const userRole = checkUserRole(["admin", "instructor", "student"])
  const [instructorUnreadCount, setInstructorUnreadCount] = useState(0)
  const [teamUnreadCount, setTeamUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [instructorNotifications, setInstructorNotifications] = useState<any[]>([])
  const [teamNotifications, setTeamNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [instructorIds, setInstructorIds] = useState<string[]>([])
  const [progressData, setProgressData] = useState<ProgressItem[]>([])
  const [progressLoading, setProgressLoading] = useState(true)
  const [userGroup, setUserGroup] = useState<Group | null>(null)
  const [groupMemberProgress, setGroupMemberProgress] = useState<MemberProgress[]>([])
  const [groupLoading, setGroupLoading] = useState(true)
  const router = useRouter()

  // Fetch instructor IDs
  useEffect(() => {
    if (isSigningOut) return

    const fetchInstructors = async () => {
      try {
        const instructors = await getInstructors()
        const ids = instructors.map((instructor: any) => instructor.uid)
        setInstructorIds(ids)
      } catch (error) {
        console.error("Error fetching instructors:", error)
      }
    }
    fetchInstructors()
  }, [isSigningOut])

  // Fetch user's group
  useEffect(() => {
    if (!userId || isSigningOut) return

    const fetchUserGroup = async () => {
      try {
        setGroupLoading(true)
        const groupsSnapshot = await getDocs(collection(db, "groups"))
        let userGroupData: Group | null = null

        groupsSnapshot.forEach((doc) => {
          const groupData = doc.data() as Omit<Group, "id">
          const isMember = groupData.members.some((member: GroupMember) => member.user_id === userId)

          if (isMember) {
            userGroupData = {
              id: doc.id,
              ...groupData,
            }
          }
        })

        if (userGroupData) {
          setUserGroup(userGroupData)
        }
      } catch (error) {
        console.error("Error fetching user group:", error)
      } finally {
        setGroupLoading(false)
      }
    }

    fetchUserGroup()
  }, [userId, isSigningOut])

  // Fetch progress for all group members
  useEffect(() => {
    if (!userGroup || !userGroup.members || isSigningOut) return

    const fetchGroupMemberProgress = async () => {
      try {
        const memberProgressPromises = userGroup.members.map(async (member: GroupMember) => {
          try {
            const response = await fetch(`${apiUrlBase}/get-user-progress?user_id=${member.user_id}`)
            let progressData: ProgressItem[] = []

            if (response.ok) {
              progressData = await response.json()
            }

            const recentProgress = progressData
              .filter((item) => item.completed)
              .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())[0]

            const totalCompleted = progressData.filter((item) => item.completed).length

            return {
              user_id: member.user_id,
              name: member.name,
              email: `user${member.user_id.slice(-4)}@example.com`,
              recentProgress,
              totalCompleted,
            }
          } catch (error) {
            console.error(`Error fetching progress for member ${member.user_id}:`, error)
            return {
              user_id: member.user_id,
              name: member.name,
              totalCompleted: 0,
            }
          }
        })

        const memberProgressResults = await Promise.all(memberProgressPromises)
        setGroupMemberProgress(memberProgressResults)
      } catch (error) {
        console.error("Error fetching group member progress:", error)
      }
    }

    fetchGroupMemberProgress()
  }, [userGroup, isSigningOut])

  // Fetch student progress data
  useEffect(() => {
    if (!userId || isSigningOut) return

    const fetchProgressData = async () => {
      try {
        setProgressLoading(true)
        const response = await fetch(`${apiUrlBase}/get-user-progress?user_id=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setProgressData(data)
        } else {
          console.error("Failed to fetch progress data")
        }
      } catch (error) {
        console.error("Error fetching progress data:", error)
      } finally {
        setProgressLoading(false)
      }
    }

    fetchProgressData()
  }, [userId, isSigningOut])

  // Authentication state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          const uid = user.uid
          setUserId(uid)
          setLoading(false)
          localStorage.setItem("userId", uid)
        } else if (!isSigningOut) {
          setUserId(null)
          setLoading(false)
          router.push("/login")
        }
      },
      (error) => {
        console.error("Error in onAuthStateChanged:", error)
        setLoading(false)
      }
    )

    return () => unsubscribeAuth()
  }, [router, isSigningOut])

  // Real-time notifications listener
  useEffect(() => {
    if (!userRole || userRole !== "student" || !userId || instructorIds.length === 0 || isSigningOut) {
      return
    }

    const messagesRef = collection(db, "messages")
    const q = query(messagesRef, where("participants", "array-contains", userId))

    const unsubscribeQuery = onSnapshot(
      q,
      (snapshot) => {
        let instructorUnread = 0
        let teamUnread = 0
        const instructorMessages: any[] = []
        const teamMessages: any[] = []
        const allMessages: any[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          const conversationId = doc.id
          const messages = data.messages || []
          const otherParticipants = data.participants.filter((id: string) => id !== userId)
          const involvesInstructor = otherParticipants.some((id: string) => instructorIds.includes(id))

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
                involvesInstructor,
              }

              allMessages.push(messageData)

              if (involvesInstructor) {
                instructorUnread++
                instructorMessages.push(messageData)
              } else {
                teamUnread++
                teamMessages.push(messageData)
              }
            }
          })
        })

        setInstructorUnreadCount(instructorUnread)
        setTeamUnreadCount(teamUnread)
        setInstructorNotifications(instructorMessages)
        setTeamNotifications(teamMessages)
        setNotifications(allMessages)
      },
      (error) => {
        console.error("Error in onSnapshot Query:", error)
      }
    )

    return () => unsubscribeQuery()
  }, [userRole, userId, instructorIds, isSigningOut])

  if (loading || isSigningOut) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  // Navigation handlers
  const openIDE = () => router.push("/dashboard/student/ide")
  const goToChat = () => router.push("/dashboard/student/messages")

  // Notification toggle
  const handleBellClick = () => setShowNotifications((prev) => !prev)

  // Mark message as read
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
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  // Character limit for notification preview
  const MESSAGE_PREVIEW_LIMIT = 25

  // Function to truncate message
  const truncateMessage = (message: string) => {
    if (message.length > MESSAGE_PREVIEW_LIMIT) {
      return message.slice(0, MESSAGE_PREVIEW_LIMIT) + "..."
    }
    return message
  }

  // Calculate progress statistics
  const totalMaterials: number = 16
  const completedMaterials = progressData.filter((item) => item.completed).length
  const progressPercentage = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0
  const recentCompletions = progressData
    .filter((item) => item.completed)
    .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())
    .slice(0, 3)

  return (
    <div className="bg-background min-h-screen">
      <DashboardLayout userType="student">
        <main className="max-w-7xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Continue your CanSat journey where you left off.</p>
          </div>

          {/* Quick Actions Grid */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <QuickActionCard
                icon={BookOpen}
                title="Access Resources"
                description="Explore training materials and resources to help you build your CanSat project."
                buttonText="View Materials"
                href="/dashboard/student/training-materials"
                accentColor="from-blue-500/10 to-blue-600/5"
              />
              <QuickActionCard
                icon={Cpu}
                title="Virtual Arduino IDE"
                description="Code and test your CanSat firmware directly in your browser."
                buttonText="Open IDE"
                onClick={openIDE}
                accentColor="from-emerald-500/10 to-emerald-600/5"
              />
              {/*<QuickActionCard*/}
              {/*  icon={MessageSquare}*/}
              {/*  title="Collaboration"*/}
              {/*  description="Chat and collaborate with teammates and instructors in real time."*/}
              {/*  buttonText="Join Chat"*/}
              {/*  onClick={goToChat}*/}
              {/*  accentColor="from-violet-500/10 to-violet-600/5"*/}
              {/*/>*/}
              {<QuickActionCard
                  icon={Sparkles}
                  title="Open Laika"
                  description="Laika: The Avakas Lab CanSat AI agent."
                  buttonText="Join Chat"
                  onClick={() => window.dispatchEvent(new Event(LAIKA_TOGGLE_EVENT))}
                  accentColor="from-violet-500/10 to-violet-600/5"
                  />
              }
            </div>
          </section>

          {/* Learning Progress Section */}
          <section className="mb-8">
            <Card className="bg-card border border-border rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border bg-secondary/30 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10">
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Learning Progress</CardTitle>
                      <p className="text-sm text-muted-foreground">Track your course completion</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-sm px-3 py-1 ${
                      progressPercentage >= 75
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                        : progressPercentage >= 50
                          ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {progressPercentage >= 75 ? "Excellent" : progressPercentage >= 50 ? "Good Progress" : "Getting Started"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {progressLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-muted-foreground text-sm">Loading progress...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <StatCard
                        icon={Layers}
                        label="Total Materials"
                        value={totalMaterials}
                        accentColor="from-blue-500/20 to-blue-600/10"
                      />
                      <StatCard
                        icon={CheckCircle2}
                        label="Completed"
                        value={completedMaterials}
                        accentColor="from-green-500/20 to-green-600/10"
                      />
                      <StatCard
                        icon={Target}
                        label="Progress"
                        value={`${progressPercentage}%`}
                        accentColor="from-orange-500/20 to-orange-600/10"
                      />
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Overall Progress</span>
                        <span className="text-foreground font-semibold">
                          {completedMaterials} of {totalMaterials} completed
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={progressPercentage} className="h-3 rounded-full" />
                      </div>
                    </div>

                    {/* Recent Completions */}
                    {recentCompletions.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Recent Completions
                        </h3>
                        <div className="grid gap-3">
                          {recentCompletions.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
                                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-foreground truncate">
                                    {item.title.replace("pdfs/", "").replace(".pdf", "")}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Completed {new Date(item.completion_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 shrink-0">
                                Complete
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Group Highlights Section */}
          {userGroup && (
            <section className="mb-8">
              <Card className="bg-card border border-border rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-secondary/30 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                      <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Team Progress</CardTitle>
                      <p className="text-sm text-muted-foreground">{userGroup.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {groupLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-muted-foreground text-sm">Loading team data...</p>
                      </div>
                    </div>
                  ) : groupMemberProgress.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupMemberProgress.map((member) => (
                        <TeamMemberCard
                          key={member.user_id}
                          member={member}
                          isCurrentUser={member.user_id === userId}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground text-center">No team members found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="fixed top-16 right-2 sm:right-4 md:right-8 z-50 w-[calc(100vw-1rem)] sm:w-80 max-w-sm">
              <Card className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-secondary/30 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">Unread Messages</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-border">
                      {notifications.map((notification, index) => (
                        <div key={index} className="p-4 hover:bg-secondary/30 transition-colors">
                          <p className="text-sm text-foreground font-medium mb-1">
                            {truncateMessage(notification.message)}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            From: {notification.sender} ({notification.involvesInstructor ? "Instructor" : "Team"})
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              onClick={() => handleMarkAsRead(notification)}
                            >
                              Mark Read
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">No unread messages</p>
                    </div>
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
