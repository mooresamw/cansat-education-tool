"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { checkUserRole } from "@/lib/checkAuth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db, auth, getInstructors } from "@/lib/firebaseConfig"
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  HiBookOpen,
  HiChip,
  HiChatAlt,
  HiMail,
  HiTrendingUp,
  HiCheckCircle,
  HiClock,
  HiUsers,
  HiUser,
} from "react-icons/hi"
import { markMessageAsRead } from "@/lib/firestoreUtil"
import {Circle} from "lucide-react";

interface ProgressItem {
  accessed_at: string
  completed: boolean
  completion_date: string
  material_id: string
  title: string
  type: string
}

interface GroupMember {
  name: string;
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

export default function StudentDashboard() {
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
    const fetchInstructors = async () => {
      try {
        const instructors = await getInstructors()
        const ids = instructors.map((instructor: any) => instructor.uid)
        setInstructorIds(ids)
        console.log("Instructor IDs:", ids)
      } catch (error) {
        console.error("Error fetching instructors:", error)
      }
    }
    fetchInstructors()
  }, [])

  // Fetch user's group
  useEffect(() => {
    const fetchUserGroup = async () => {
      if (!userId) return

      try {
        setGroupLoading(true)
        const groupsRef = collection(db, "groups")
        const q = query(groupsRef, where("members", "array-contains", { user_id: userId }))

        // Note: This query might not work exactly as expected due to Firestore limitations
        // You might need to fetch all groups and filter client-side
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
          console.log("User's group:", userGroupData)
        }
      } catch (error) {
        console.error("Error fetching user group:", error)
      } finally {
        setGroupLoading(false)
      }
    }

    if (userId) {
      fetchUserGroup()
    }
  }, [userId])

  // Fetch progress for all group members
  useEffect(() => {
    const fetchGroupMemberProgress = async () => {
      if (!userGroup || !userGroup.members) return

      try {
        const memberProgressPromises = userGroup.members.map(async (member: GroupMember) => {
          try {
            // Fetch progress data for each member
            const response = await fetch(`http://localhost:8080/get-user-progress?user_id=${member.user_id}`)
            let progressData: ProgressItem[] = []

            if (response.ok) {
              progressData = await response.json()
            }

            // Get the most recent progress item
            const recentProgress = progressData
              .filter((item) => item.completed)
              .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())[0]

            const totalCompleted = progressData.filter((item) => item.completed).length

            // Fetch user info (you might want to create a separate API for this)
            // For now, we'll use placeholder data
            const memberInfo: MemberProgress = {
              user_id: member.user_id,
              name: member.name, // Placeholder
              email: `user${member.user_id.slice(-4)}@example.com`, // Placeholder
              recentProgress,
              totalCompleted,
            }

            return memberInfo
          } catch (error) {
            console.error(`Error fetching progress for member ${member.user_id}:`, error)
            return {
              user_id: member.user_id,
              displayName: `User ${member.user_id.slice(-4)}`,
              totalCompleted: 0,
            }
          }
        })

        const memberProgressResults = await Promise.all(memberProgressPromises)
        setGroupMemberProgress(memberProgressResults)
        console.log(memberProgressResults)
        console.log("Group member progress:", memberProgressResults)
      } catch (error) {
        console.error("Error fetching group member progress:", error)
      }
    }

    if (userGroup) {
      fetchGroupMemberProgress()
    }
  }, [userGroup])

  // Fetch student progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!userId) return

      try {
        setProgressLoading(true)
        const response = await fetch(`http://localhost:8080/get-user-progress?user_id=${userId}`)
        if (response.ok) {
          const data = await response.json()
          console.log(data)
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

    if (userId) {
      fetchProgressData()
    }
  }, [userId])

  // Authentication state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          const uid = user.uid
          setUserId(uid)
          setLoading(false)
          console.log("User authenticated, UID:", uid)
          localStorage.setItem("userId", uid)
        } else {
          console.log("No user is authenticated")
          setUserId(null)
          setLoading(false)
          router.push("/login")
        }
      },
      (error) => {
        console.error("Error in onAuthStateChanged:", error)
        setLoading(false)
      },
    )

    return () => unsubscribeAuth()
  }, [router])

  // Real-time notifications listener
  useEffect(() => {
    if (!userRole || userRole !== "student") {
      console.log("User role is not student or not authenticated:", userRole)
      return
    }
    if (!userId) {
      console.log("No userId available yet")
      return
    }
    if (instructorIds.length === 0) {
      console.log("Instructor IDs not yet loaded")
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
          const otherParticipantId = otherParticipants[0] // Assuming 1:1 chat

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

        console.log("Instructor unread count:", instructorUnread)
        console.log("Team unread count:", teamUnread)
        console.log("All messages after filtering:", allMessages)

        setInstructorUnreadCount(instructorUnread)
        setTeamUnreadCount(teamUnread)
        setInstructorNotifications(instructorMessages)
        setTeamNotifications(teamMessages)
        setNotifications(allMessages)
      },
      (error) => {
        console.error("Error in onSnapshot Query:", error)
      },
    )

    return () => unsubscribeQuery()
  }, [userRole, userId, instructorIds])

  // Navigation handlers
  const openIDE = () => router.push("/dashboard/student/ide")
  const goToChat = () => router.push("/dashboard/student/messageStudent")
  const messageInstructor = () => router.push("/dashboard/student/message")

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
      console.log(`Marked message ${messageId} as read for user ${userId}`)
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  // Character limit for notification preview
  const MESSAGE_PREVIEW_LIMIT = 25

  // Function to truncate message if it exceeds the limit
  const truncateMessage = (message: string) => {
    if (message.length > MESSAGE_PREVIEW_LIMIT) {
      return message.slice(0, MESSAGE_PREVIEW_LIMIT) + "..."
    }
    return message
  }

  // Calculate progress statistics
  const totalMaterials: number = 39
  const completedMaterials = progressData.filter((item) => item.completed).length
  const progressPercentage = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0
  const recentCompletions = progressData
    .filter((item) => item.completed)
    .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())
    .slice(0, 3)

  if (loading) {
    return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>
  }

  if (!userId) {
    return null
  }

  return (
    <div className="bg-black min-h-screen text-primary">
      <DashboardLayout userType="student">
        <main className="max-w-6xl mx-auto w-full px-4 py-12 relative">
          {/* Header */}
          {/*<h1 className="text-3xl md:text-4xl font-bold mb-6">Student Dashboard</h1>*/}

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1: Access Resources */}
            <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiBookOpen className="text-3xl text-blue-500 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-primary text-xl">Access Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Explore training materials and resources to help you build your CanSat project.
                </p>
                <Link href="/dashboard/student/training-materials">
                  <Button className="bg-white text-black hover:bg-gray-200">View Training Materials</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card 2: Virtual Arduino IDE */}
            <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiChip className="text-3xl text-green-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-primary text-xl">Virtual Arduino IDE</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Code and test your CanSat firmware directly in your browser.
                </p>
                <Button onClick={openIDE} className="bg-white text-black hover:bg-gray-200">
                  Open IDE
                </Button>
              </CardContent>
            </Card>

            {/* Card 3: Collaboration Tools */}
            <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiChatAlt className="text-3xl text-purple-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-primary text-xl">Collaboration Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">Chat and collaborate with teammates in real time.</p>
                <Button onClick={goToChat} className="bg-white text-black hover:bg-gray-200">
                  Join Team Chat
                </Button>
              </CardContent>
            </Card>

            {/* Card 4: Direct Messaging */}
            <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiMail className="text-3xl text-yellow-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-primary text-xl">Direct Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Privately message your instructor for feedback or questions.
                </p>
                <Button onClick={messageInstructor} className="bg-white text-black hover:bg-gray-200">
                  Message Instructor
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          <div className="mb-8">
            <Card className="bg-card border border-border rounded-md">
              <CardHeader className="flex flex-row items-center space-x-3">
                <HiTrendingUp className="text-3xl text-orange-500" />
                <CardTitle className="text-primary text-2xl">Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-400">Loading progress data...</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <HiBookOpen className="text-blue-500" />
                          <span className="text-sm text-gray-400">Total Materials</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">{totalMaterials}</div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <HiCheckCircle className="text-green-500" />
                          <span className="text-sm text-gray-400">Completed</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">{completedMaterials}</div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <HiTrendingUp className="text-orange-500" />
                          <span className="text-sm text-gray-400">Progress</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Overall Progress</span>
                        <span className="text-primary">
                          {completedMaterials}/{totalMaterials} completed
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    {/* Recent Completions */}
                    {recentCompletions.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                          <HiClock className="text-green-500" />
                          <span>Recent Completions</span>
                        </h3>
                        <div className="space-y-2">
                          {recentCompletions.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-primary">
                                  {item.title.replace("pdfs/", "").replace(".pdf", "")}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Completed on {new Date(item.completion_date).toLocaleDateString()}
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                <HiCheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View All Progress Button */}
                    <div className="pt-4">
                      <Link href="/dashboard/student/progress">
                        <Button variant="outline" className="w-full bg-transparent">
                          View Detailed Progress
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Group Highlights Section */}
          {userGroup && (
            <div className="mb-8">
              <Card className="bg-card border border-border rounded-md">
                <CardHeader className="flex flex-row items-center space-x-3">
                  <HiUsers className="text-3xl text-purple-500" />
                  <div>
                    <CardTitle className="text-primary text-2xl">Group Highlights</CardTitle>
                    <p className="text-sm text-gray-400 mt-1">{userGroup.name}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  {groupLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-400">Loading group data...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupMemberProgress.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupMemberProgress.map((member, index) => (
                            <div key={member.user_id} className="bg-background rounded-lg p-4 border border-border">
                              <div className="flex items-center space-x-3 mb-3">
                                {/*<Avatar className="h-10 w-10">*/}
                                {/*  <AvatarFallback>*/}
                                {/*    <HiUser className="h-5 w-5" />*/}
                                {/*  </AvatarFallback>*/}
                                {/*</Avatar>*/}
                                <div className="flex-1 min-w-0">
                                  <p className="text-med font-bold text-primary truncate">{member.name}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {member.totalCompleted} materials completed
                                  </p>
                                </div>
                                {member.user_id === userId && (
                                  <Badge variant="outline" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>

                              {member.recentProgress ? (
                                <div className="space-y-2">
                                  <div className="text-xs text-gray-400">Most Recent:</div>
                                  <div className="bg-card rounded p-2 border border-border">
                                    <div className="text-sm font-medium text-primary mb-1">
                                      {member.recentProgress.title.replace("pdfs/", "").replace(".pdf", "")}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="text-xs text-gray-400">
                                        {new Date(member.recentProgress.completion_date).toLocaleDateString()}
                                      </div>
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                                      >
                                        <HiCheckCircle className="w-3 h-3 mr-1" />
                                        Complete
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">No completed materials yet</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <HiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-400">No group members found</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="fixed top-14 right-16 bg-background border border-border shadow-lg rounded-md p-4 w-72 z-10">
              <h3 className="font-bold text-lg text-primary">Unread Messages</h3>
              {notifications.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {notifications.map((notification, index) => (
                    <li key={index} className="p-2 bg-card rounded">
                      <p className="text-sm text-primary">{truncateMessage(notification.message)}</p>
                      <p className="text-xs text-gray-400">
                        From: {notification.sender} ({notification.involvesInstructor ? "Instructor" : "Team"})
                      </p>
                      <p className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p>
                      <button
                        onClick={() => handleMarkAsRead(notification)}
                        className="mt-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded px-2 py-1"
                      >
                        Mark as Read
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 mt-2">No unread messages</p>
              )}
            </div>
          )}
        </main>
      </DashboardLayout>
    </div>
  )
}
