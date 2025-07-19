"use client"

import { useEffect, useState, useRef } from "react"
import { auth, db } from "@/lib/firebaseConfig"
import { collection, getDocs, query, where, addDoc, updateDoc, arrayUnion, doc } from "firebase/firestore"
import { FiMessageCircle, FiSend } from "react-icons/fi"
import { sendMessage, handleReaction, handleEditMessage, getMessages, markMessageAsRead } from "@/lib/firestoreUtil"
import { DashboardLayout } from "@/components/DashboardLayout"
import Loading from "@/components/Loading"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Users, GraduationCap, MessageSquare } from "lucide-react"

type ChatType = "instructor" | "student" | "group"

interface Chat {
  id: string
  name: string
  email?: string
  type: ChatType
  members?: any[]
  uid?: string
  instructor_email?: string
}

export default function UnifiedChatPage() {
  const [user, setUser] = useState<any>(null)
  const [instructors, setInstructors] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [loading, setLoading] = useState(true)

  // Group creation states
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [joinGroupOpen, setJoinGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [instructorEmail, setInstructorEmail] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDocs(query(collection(db, "users"), where("user_id", "==", currentUser.uid)))
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data()
          setUser({ ...currentUser, ...userData })
          setLoading(false)
        }
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  // Fetch instructors
  useEffect(() => {
    async function fetchInstructors() {
      if (!user || !user.school_id) return

      const instructorsQuery = query(
        collection(db, "users"),
        where("role", "==", "instructor"),
        where("school_id", "==", user.school_id),
      )
      const snapshot = await getDocs(instructorsQuery)
      const instructorsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.data().user_id,
        type: "instructor" as ChatType,
        ...doc.data(),
      }))
      setInstructors(instructorsList)
    }
    fetchInstructors()
  }, [user])

  // Fetch students and groups
  useEffect(() => {
    async function fetchStudentsAndGroups() {
      if (!user || !user.school_id) return

      // Fetch students
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("school_id", "==", user.school_id),
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      const studentsList = studentsSnapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            uid: data.user_id,
            type: "student" as ChatType,
            ...data,
          }
        })
        .filter((student) => student.uid !== user.uid)

      // Fetch groups
      const groupsQuery = query(collection(db, "groups"), where("school_id", "==", user.school_id))
      const groupsSnapshot = await getDocs(groupsQuery)
      const groupsList = groupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        type: "group" as ChatType,
        ...doc.data(),
      }))

      // Mark students who are in groups
      studentsList.forEach((student) => {
        student.inGroup = groupsList.some(
          (group) =>
            group.members &&
            group.members.some((member: any) =>
              typeof member === "string" ? member === student.uid : member.user_id === student.uid,
            ),
        )
      })

      setStudents(studentsList)
      setGroups(groupsList)
    }
    fetchStudentsAndGroups()
  }, [user])

  // Real-time listener for messages
  useEffect(() => {
    if (!selectedChat || !user) return

    let chatId: string

    switch (selectedChat.type) {
      case "instructor":
        chatId = [user.uid, selectedChat.uid].sort().join("_")
        break
      case "student":
        chatId = [user.uid, selectedChat.uid].sort().join("_")
        break
      case "group":
        chatId = selectedChat.id
        break
      default:
        return
    }

    const unsubscribe = getMessages(chatId, (newMessages: any[]) => {
      setMessages(newMessages)
      newMessages.forEach((msg) => {
        if (msg.sender !== user.uid && !msg.read?.[user.uid]) {
          markMessageAsRead(chatId, user.uid, msg.messageId)
        }
      })
    })

    return () => unsubscribe()
  }, [selectedChat, user])

  // Send message
  const handleSendMessage = async () => {
    if (!user || !message.trim() || !selectedChat) {
      alert("You must be logged in and select a chat to send a message.")
      return
    }

    let chatId: string
    let participants: string[]

    switch (selectedChat.type) {
      case "instructor":
        chatId = [user.uid, selectedChat.uid].sort().join("_")
        participants = [user.uid, selectedChat.uid]
        break
      case "student":
        chatId = [user.uid, selectedChat.uid].sort().join("_")
        participants = [user.uid, selectedChat.uid]
        break
      case "group":
        chatId = selectedChat.id
        participants = selectedChat.members?.map((m: any) => (typeof m === "string" ? m : m.user_id)) || []
        break
      default:
        return
    }

    try {
      await sendMessage(chatId, user.uid, message, participants)
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message.")
    }
  }

  // Handle reactions
  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!user || !selectedChat) return

    let chatId: string
    switch (selectedChat.type) {
      case "instructor":
        chatId = [user.uid, selectedChat.uid].sort().join("_")
        break
      case "student":
        chatId = [user.uid, selectedChat.uid].sort().join("_")
        break
      case "group":
        chatId = selectedChat.id
        break
      default:
        return
    }

    try {
      await handleReaction(chatId, user.uid, messageId, emoji)
    } catch (error) {
      console.error("Error updating reaction:", error)
      alert("Failed to update reaction.")
    }
  }

  // Handle message editing
  const handleEditMessageClick = async (messageId: string, newText: string) => {
    if (!user || !selectedChat) return

    let chatId: string
    switch (selectedChat.type) {
      case "instructor":
        chatId = [user.uid, selectedChat.uid].sort().join("_")
        break
      case "student":
        chatId = [user.uid, selectedChat.uid].sort().join("_")
        break
      case "group":
        chatId = selectedChat.id
        break
      default:
        return
    }

    try {
      await handleEditMessage(chatId, user.uid, messageId, newText)
      setEditingMessageId(null)
      setEditingText("")
    } catch (error) {
      console.error("Error editing message:", error)
      alert("Failed to edit message.")
    }
  }

  // Group management functions
  const handleCreateGroup = async () => {
    if (!groupName.trim() || !instructorEmail.trim() || selectedMembers.length === 0) {
      alert("Please fill all fields and select at least one member")
      return
    }

    try {
      const userInGroup = groups.some((group) =>
        group.members?.some((member: any) =>
          typeof member === "string" ? member === user.uid : member.user_id === user.uid,
        ),
      )

      if (userInGroup) {
        alert("You are already in a group. You can only belong to one group at a time.")
        return
      }

      const selectedMembersInGroups = students
        .filter((student) => selectedMembers.includes(student.uid) && student.inGroup)
        .map((student) => student.name)

      if (selectedMembersInGroups.length > 0) {
        alert(`The following students are already in groups: ${selectedMembersInGroups.join(", ")}`)
        return
      }

      const currentTimestamp = new Date()
      const members = [
        ...selectedMembers.map((memberId: string) => ({
          user_id: memberId,
          joined_at: currentTimestamp,
        })),
        { user_id: user.uid, joined_at: currentTimestamp },
      ]

      await addDoc(collection(db, "groups"), {
        name: groupName,
        instructor_email: instructorEmail,
        members,
        school_id: user.school_id,
        created_at: currentTimestamp,
        created_by: user.uid,
      })

      setGroupName("")
      setInstructorEmail("")
      setSelectedMembers([])
      setCreateGroupOpen(false)

      // Refresh data
      await refreshData()
      alert("Group created successfully!")
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group.")
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      const userInGroup = groups.some((group) =>
        group.members?.some((member: any) =>
          typeof member === "string" ? member === user.uid : member.user_id === user.uid,
        ),
      )

      if (userInGroup) {
        alert("You are already in a group. You can only belong to one group at a time.")
        return
      }

      const groupRef = doc(db, "groups", groupId)
      const currentTimestamp = new Date()
      await updateDoc(groupRef, {
        members: arrayUnion({
          user_id: user.uid,
          name: user.name,
          joined_at: currentTimestamp,
        }),
      })

      await refreshData()
      setJoinGroupOpen(false)
      alert("You have joined the group successfully!")
    } catch (error) {
      console.error("Error joining group:", error)
      alert("Failed to join group.")
    }
  }

  const refreshData = async () => {
    if (!user || !user.school_id) return

    // Refresh groups
    const groupsQuery = query(collection(db, "groups"), where("school_id", "==", user.school_id))
    const groupsSnapshot = await getDocs(groupsQuery)
    const groupsList = groupsSnapshot.docs.map((doc) => ({
      id: doc.id,
      type: "group" as ChatType,
      ...doc.data(),
    }))
    setGroups(groupsList)

    // Refresh students
    const studentsQuery = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("school_id", "==", user.school_id),
    )
    const studentsSnapshot = await getDocs(studentsQuery)
    const studentsList = studentsSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          uid: data.user_id,
          type: "student" as ChatType,
          ...data,
        }
      })
      .filter((student) => student.uid !== user.uid)

    studentsList.forEach((student) => {
      student.inGroup = groupsList.some(
        (group) =>
          group.members &&
          group.members.some((member: any) =>
            typeof member === "string" ? member === student.uid : member.user_id === student.uid,
          ),
      )
    })

    setStudents(studentsList)
  }

  const toggleMemberSelection = (studentId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Helper functions
  const formatTimestamp = (timestamp: any) => {
    return timestamp
      ? new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Just now"
  }

  const formatDateSeparator = (timestamp: any) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return "Today"
    if (isYesterday) return "Yesterday"
    return date.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getChatIcon = (chat: Chat) => {
    switch (chat.type) {
      case "instructor":
        return <GraduationCap className="h-5 w-5 text-gray-400" />
      case "group":
        return <Users className="h-5 w-5 text-gray-400" />
      default:
        return <MessageSquare className="h-5 w-5 text-gray-400" />
    }
  }

  const getChatSubtitle = (chat: Chat) => {
    switch (chat.type) {
      case "instructor":
        return chat.email || "Instructor"
      case "group":
        return `${chat.members?.length || 0} members`
      case "student":
        return chat.email || "Student"
      default:
        return ""
    }
  }

  if (loading) return <Loading />

  // Get user's groups for filtering direct messages
  const userGroups = groups.filter((group) =>
    group.members?.some((member: any) =>
      typeof member === "string" ? member === user.uid : member.user_id === user.uid,
    ),
  )

  const groupMemberIds = userGroups
    .flatMap(
      (group) => group.members?.map((member: any) => (typeof member === "string" ? member : member.user_id)) || [],
    )
    .filter((id: string) => id !== user.uid)

  const availableStudents = students.filter((student) => groupMemberIds.includes(student.uid))

  return (
    <DashboardLayout userType={user?.role || "student"}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-card text-primary shadow-md py-4 px-6">
          <h1 className="text-2xl font-bold">Messages - {user?.school_name?.split(",")[0]}</h1>
        </header>

        <div className="flex flex-1 overflow-hidden bg-gray-50">
          {/* Sidebar */}
          <div className="w-80 border-r border-border flex flex-col">
            <div className="p-4 bg-card shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Chats</h2>
            </div>

            <div className="flex-1 overflow-y-auto bg-card">
              {/* Instructors Section */}
              <div className="p-4 border-b">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Instructors</h3>
                {instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    onClick={() => setSelectedChat(instructor)}
                    className={`flex items-center p-4 space-x-3 cursor-pointer transition-colors duration-150 ${
                      selectedChat?.id === instructor.id && selectedChat?.type === "instructor"
                        ? "bg-accent border-l-4 border-blue-500"
                        : "hover:bg-accent border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {instructor.name?.[0]?.toUpperCase() || "I"}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary truncate">{instructor.name}</p>
                      <p className="text-xs text-gray-500 truncate">{getChatSubtitle(instructor)}</p>
                    </div>
                    {getChatIcon(instructor)}
                  </div>
                ))}
              </div>

              {/* Groups Section */}
              {userGroups.length > 0 && (
                <div className="p-4 border-b">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Group Chats</h3>
                  {userGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => setSelectedChat(group)}
                      className={`flex items-center p-4 space-x-3 cursor-pointer transition-colors duration-150 ${
                        selectedChat?.id === group.id && selectedChat?.type === "group"
                          ? "bg-accent border-l-4 border-purple-500"
                          : "hover:bg-accent border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium">
                          {group.name?.[0]?.toUpperCase() || "G"}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary truncate">{group.name}</p>
                        <p className="text-xs text-gray-500 truncate">{getChatSubtitle(group)}</p>
                      </div>
                      {getChatIcon(group)}
                    </div>
                  ))}
                </div>
              )}

              {/* Direct Messages Section */}
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Direct Messages</h3>
                {availableStudents.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    {userGroups.length === 0
                      ? "Join or create a group to message other students."
                      : "No other students in your group."}
                  </div>
                ) : (
                  availableStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedChat(student)}
                      className={`flex items-center p-4 space-x-3 cursor-pointer transition-colors duration-150 ${
                        selectedChat?.id === student.id && selectedChat?.type === "student"
                          ? "bg-accent border-l-4 border-green-500"
                          : "hover:bg-accent border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                          {student.name?.[0]?.toUpperCase() || "S"}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary truncate">{student.name}</p>
                        <p className="text-xs text-gray-500 truncate">{getChatSubtitle(student)}</p>
                      </div>
                      {getChatIcon(student)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Group Management Buttons */}
            <div className="flex justify-center space-x-2 px-4 py-3 bg-card border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateGroupOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Create Group
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJoinGroupOpen(true)}
                className="flex items-center gap-2"
              >
                <Users size={16} />
                Join Group
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="bg-card p-4 shadow-sm flex items-center space-x-3">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium text-xl ${
                      selectedChat.type === "instructor"
                        ? "bg-blue-500"
                        : selectedChat.type === "group"
                          ? "bg-purple-500"
                          : "bg-green-500"
                    }`}
                  >
                    {selectedChat.name?.[0]?.toUpperCase() ||
                      (selectedChat.type === "instructor" ? "I" : selectedChat.type === "group" ? "G" : "S")}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-primary">{selectedChat.name}</h2>
                    <p className="text-sm text-gray-500">{getChatSubtitle(selectedChat)}</p>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                      <FiMessageCircle className="h-12 w-12" />
                      <p className="text-lg">No messages yet</p>
                      <p className="text-sm">
                        Start a conversation with{" "}
                        {selectedChat.type === "group" ? `${selectedChat.name} group` : selectedChat.name}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isSender = msg.sender === user.uid
                      const timestamp = formatTimestamp(msg.timestamp)

                      // Get sender data for group chats
                      let senderData = null
                      if (selectedChat.type === "group" && !isSender) {
                        senderData = students.find((s) => s.uid === msg.sender) ||
                          instructors.find((i) => i.uid === msg.sender) || { name: "Unknown User" }
                      }

                      // Date separator logic
                      const currentDate = msg.timestamp ? new Date(msg.timestamp).toDateString() : ""
                      const prevDate =
                        index > 0 && messages[index - 1].timestamp
                          ? new Date(messages[index - 1].timestamp).toDateString()
                          : null
                      const showDateSeparator = index === 0 || currentDate !== prevDate

                      return (
                        <div key={msg.messageId} className="space-y-2">
                          {showDateSeparator && (
                            <div className="text-center my-2">
                              <span className="inline-block bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                                {formatDateSeparator(msg.timestamp)}
                              </span>
                            </div>
                          )}

                          <div className={`flex items-end ${isSender ? "justify-end" : "justify-start"}`}>
                            {!isSender && (
                              <div className="mr-2 flex-shrink-0">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm ${
                                    selectedChat.type === "instructor"
                                      ? "bg-blue-500"
                                      : selectedChat.type === "group"
                                        ? "bg-purple-500"
                                        : "bg-green-500"
                                  }`}
                                >
                                  {selectedChat.type === "group"
                                    ? senderData?.name?.[0]?.toUpperCase() || "U"
                                    : selectedChat.name?.[0]?.toUpperCase() || "U"}
                                </div>
                              </div>
                            )}

                            <div
                              className={`relative max-w-sm p-4 rounded-3xl shadow-lg transition-all duration-200 ${
                                isSender
                                  ? "bg-blue-500 text-white rounded-br-sm"
                                  : "bg-white text-gray-900 rounded-bl-sm"
                              }`}
                            >
                              {selectedChat.type === "group" && !isSender && (
                                <p className="text-xs text-gray-500 mb-1">{senderData?.name || "Unknown User"}</p>
                              )}

                              {editingMessageId === msg.messageId ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-black bg-gray-50"
                                    style={{ minHeight: "60px" }}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleEditMessageClick(msg.messageId, editingText)}
                                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingMessageId(null)}
                                      className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="break-words">
                                    {msg.message}
                                    {msg.edited && <span className="ml-2 text-xs text-gray-300 italic">(edited)</span>}
                                  </p>
                                  <div className={`text-xs mt-1 ${isSender ? "text-blue-200" : "text-gray-500"}`}>
                                    {timestamp}
                                  </div>
                                  {isSender && (
                                    <button
                                      onClick={() => {
                                        setEditingMessageId(msg.messageId)
                                        setEditingText(msg.message)
                                      }}
                                      className="mt-1 text-xs text-blue-200 hover:text-blue-100 transition-colors"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </>
                              )}

                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleReactionClick(msg.messageId, "👍")}
                                  className="text-sm text-gray-600 hover:text-gray-900 transform hover:scale-105 transition-transform"
                                >
                                  👍
                                </button>
                                <button
                                  onClick={() => handleReactionClick(msg.messageId, "❤️")}
                                  className="text-sm text-gray-600 hover:text-gray-900 transform hover:scale-105 transition-transform"
                                >
                                  ❤️
                                </button>
                                <button
                                  onClick={() => handleReactionClick(msg.messageId, "😆")}
                                  className="text-sm text-gray-600 hover:text-gray-900 transform hover:scale-105 transition-transform"
                                >
                                  😆
                                </button>
                                {Object.entries(msg.reactions || {}).map(([uid, emoji]) => (
                                  <span
                                    key={uid}
                                    className={`text-sm px-1 rounded-full ${
                                      isSender ? "bg-blue-600/20" : "bg-gray-200"
                                    }`}
                                  >
                                    {emoji as string}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {isSender && (
                              <div className="ml-2 flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm">
                                  {user.name?.[0] || "Y"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-card border-t border-border p-4">
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={2}
                      className="w-full p-3 pr-16 resize-none bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="absolute bottom-6 right-3 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm transition-colors"
                    >
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-card">
                <div className="max-w-md text-center space-y-4">
                  <FiMessageCircle className="h-16 w-16 text-gray-300 mx-auto" />
                  <h3 className="text-xl font-semibold text-gray-900">Select a chat</h3>
                  <p className="text-gray-500">Choose an instructor, student, or group to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a New Group</DialogTitle>
            <DialogDescription>Create a study group with your classmates</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">
                Group Name
              </Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
                placeholder="Enter group name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instructor-email" className="text-right">
                Instructor Email
              </Label>
              <Input
                id="instructor-email"
                value={instructorEmail}
                onChange={(e) => setInstructorEmail(e.target.value)}
                className="col-span-3"
                placeholder="Enter instructor email"
                type="email"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Add Members</Label>
              <div className="col-span-3 border rounded-md p-3 max-h-60 overflow-y-auto">
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students available</p>
                ) : (
                  <div className="space-y-2">
                    {students
                      .filter(
                        (student) => !student.inGroup && student.name.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      .map((student) => (
                        <div key={student.uid} className="flex items-center space-x-2">
                          <Checkbox
                            id={`student-${student.uid}`}
                            checked={selectedMembers.includes(student.uid)}
                            onCheckedChange={() => toggleMemberSelection(student.uid)}
                          />
                          <Label htmlFor={`student-${student.uid}`} className="flex items-center gap-2 cursor-pointer">
                            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                              {student.name?.[0]?.toUpperCase() || "S"}
                            </div>
                            <span>{student.name}</span>
                          </Label>
                        </div>
                      ))}
                    {students.filter((student) => !student.inGroup).length === 0 && (
                      <p className="text-sm text-muted-foreground">All students are already in groups</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={joinGroupOpen} onOpenChange={setJoinGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Group</DialogTitle>
            <DialogDescription>Browse and join existing study groups</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-2 text-lg font-semibold">No groups available</h3>
                <p className="text-sm text-muted-foreground">Create a new group to get started</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {groups.map((group) => {
                  const isMember = group.members?.some((member: any) =>
                    typeof member === "string" ? member === user.uid : member.user_id === user.uid,
                  )
                  return (
                    <div key={group.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{group.name}</h4>
                          <p className="text-sm text-muted-foreground">Instructor: {group.instructor_email}</p>
                        </div>
                        {isMember ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Joined</span>
                        ) : (
                          <Button size="sm" onClick={() => handleJoinGroup(group.id)} disabled={userGroups.length > 0}>
                            Join
                          </Button>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Members:</p>
                        <div className="flex flex-wrap gap-1">
                          {group.members?.map((member: any) => {
                            const memberId = typeof member === "string" ? member : member.user_id
                            const memberData =
                              students.find((s) => s.uid === memberId) || (memberId === user.uid ? user : null)
                            if (!memberData) return null
                            return (
                              <div
                                key={memberId}
                                className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs"
                              >
                                <div className="h-4 w-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px]">
                                  {memberData.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <span>{memberData.name || "Unknown"}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinGroupOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
