"use client"

import React, { useEffect, useState } from "react"
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc } from "firebase/firestore"
import { Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { Bell, MessageCircleIcon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface NotificationsProps {
  userId: string
  userRole: "admin" | "instructor" | "student"
}

interface Notification {
  id?: string;
  sender?: string;
  message?: string;
  timestamp?: string;
  involvesInstructor?: boolean;
  involvesStudent?: boolean;
  email?: string;
  name?: string;
  role?: string;
  chatId?: string;
  messageIndex?: number;
}

export function Notifications({ userId, userRole }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [instructorNotifications, setInstructorNotifications] = useState<Notification[]>([])
  const [teamNotifications, setTeamNotifications] = useState<Notification[]>([])
  const [instructorUnreadCount, setInstructorUnreadCount] = useState(0)
  const [teamUnreadCount, setTeamUnreadCount] = useState(0)
  const [studentUnreadCount, setStudentUnreadCount] = useState(0)
  const [verifiedUserNotifications, setVerifiedUserNotifications] = useState<Notification[]>([])
  const [verifiedUserCount, setVerifiedUserCount] = useState(0)
  const [instructorIds, setInstructorIds] = useState<string[]>([])
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [acknowledgedVerifiedUsers, setAcknowledgedVerifiedUsers] = useState<string[]>([])

  const formatTimestamp = (timestamp: any): string => {
    try {
      if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toLocaleString()
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleString()
      } else if (typeof timestamp === "string") {
        const date = new Date(timestamp)
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleString()
      }
      return "N/A"
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return "N/A"
    }
  }

  // New truncate message function
  const truncateMessage = (message: string | undefined): string => {
    if (!message) return ""
    return message.length > 25 ? `${message.substring(0, 25)}...` : message
  }

  async function getName(id: string): Promise<string> {
    const q = query(collection(db, "users"), where("user_id", "==", id))
    const snapshot = await getDocs(q)
    const userData_ = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
    return userData_[0]?.name || "Unknown"
  }

  const markAllAsRead = async () => {
    try {
      if (userRole === "student" || userRole === "instructor") {
        const messagesRef = collection(db, "chats")
        const q = query(messagesRef, where("participants", "array-contains", userId))
        const snapshot = await getDocs(q)
        
        for (const chatDoc of snapshot.docs) {
          const chatData = chatDoc.data()
          const updatedMessages = chatData.messages.map((msg: any) => ({
            ...msg,
            read: {
              ...msg.read,
              [userId]: true
            }
          }))
          
          await updateDoc(doc(db, "chats", chatDoc.id), {
            messages: updatedMessages
          })
        }
      } else if (userRole === "admin") {
        const newAcknowledged = [...acknowledgedVerifiedUsers, ...verifiedUserNotifications.map(n => n.id)]
        setAcknowledgedVerifiedUsers(newAcknowledged)
        localStorage.setItem("acknowledgedVerifiedUsers", JSON.stringify(newAcknowledged))
      }
      
      setUnreadCount(0)
      setInstructorUnreadCount(0)
      setTeamUnreadCount(0)
      setStudentUnreadCount(0)
      setVerifiedUserCount(0)
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const markAsRead = async (notification: Notification) => {
    try {
      if (userRole === "student" || userRole === "instructor") {
        if (notification.chatId && notification.messageIndex !== undefined) {
          const chatRef = doc(db, "chats", notification.chatId)
          const chatSnapshot = await getDocs(query(collection(db, "chats"), where("__name__", "==", notification.chatId)))
          const chatDoc = chatSnapshot.docs[0]
          const chatData = chatDoc.data()
          
          const updatedMessages = [...chatData.messages]
          updatedMessages[notification.messageIndex] = {
            ...updatedMessages[notification.messageIndex],
            read: {
              ...updatedMessages[notification.messageIndex].read,
              [userId]: true
            }
          }

          await updateDoc(chatRef, { messages: updatedMessages })
        }
      } else if (userRole === "admin" && notification.id) {
        const newAcknowledged = [...acknowledgedVerifiedUsers, notification.id]
        setAcknowledgedVerifiedUsers(newAcknowledged)
        localStorage.setItem("acknowledgedVerifiedUsers", JSON.stringify(newAcknowledged))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  useEffect(() => {
    const fetchRoleIds = async () => {
      const usersRef = collection(db, "users")
      const instructorQuery = query(usersRef, where("role", "==", "instructor"))
      onSnapshot(instructorQuery, (snapshot) => {
        const ids = snapshot.docs.map((doc) => doc.id)
        setInstructorIds(ids)
      })

      const studentQuery = query(usersRef, where("role", "==", "student"))
      onSnapshot(studentQuery, (snapshot) => {
        const ids = snapshot.docs.map((doc) => doc.id)
        setStudentIds(ids)
      })

      const acknowledged = JSON.parse(localStorage.getItem("acknowledgedVerifiedUsers") || "[]")
      setAcknowledgedVerifiedUsers(acknowledged)
    }

    fetchRoleIds()
  }, [])

  useEffect(() => {
    if (!userId || !userRole) return

    let unsubscribeQuery

    if (userRole === "student" && instructorIds.length > 0) {
      const messagesRef = collection(db, "chats")
      const q = query(messagesRef, where("participants", "array-contains", userId))
      unsubscribeQuery = onSnapshot(q, (snapshot) => {
        let instructorUnread = 0
        let teamUnread = 0
        const instructorMessages: Notification[] = []
        const teamMessages: Notification[] = []
        const allMessages: Notification[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          const messages = data.messages || []
          const otherParticipants = data.participants.filter((id: string) => id !== userId)
          const involvesInstructor = otherParticipants.some((id: string) => instructorIds.includes(id))

          messages.forEach((msg: any, index: number) => {
            const readStatus = msg.read || {}
            const isUnread = msg.sender !== userId && readStatus[userId] !== true
            if (isUnread) {
              const messageData = {
                chatId: doc.id,
                messageIndex: index,
                sender: getName(msg.sender),
                message: msg.message,
                timestamp: formatTimestamp(msg.timestamp),
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
        setUnreadCount(instructorUnread + teamUnread)
      })
    } else if (userRole === "instructor" && studentIds.length > 0) {
      const messagesRef = collection(db, "chats")
      const q = query(messagesRef, where("participants", "array-contains", userId))
      unsubscribeQuery = onSnapshot(q, (snapshot) => {
        let studentUnread = 0
        const allMessages: Notification[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          const messages = data.messages || []
          const otherParticipants = data.participants.filter((id: string) => id !== userId)
          const involvesStudent = otherParticipants.some((id: string) => studentIds.includes(id))

          messages.forEach((msg: any, index: number) => {
            const readStatus = msg.read || {}
            const isUnread = msg.sender !== userId && readStatus[userId] !== true
            if (isUnread) {
              const messageData = {
                chatId: doc.id,
                messageIndex: index,
                sender: getName(msg.sender),
                message: msg.message,
                timestamp: formatTimestamp(msg.timestamp),
                involvesStudent,
              }
              allMessages.push(messageData)
              if (involvesStudent) studentUnread++
            }
          })
        })

        setStudentUnreadCount(studentUnread)
        setNotifications(allMessages)
        setUnreadCount(studentUnread)
      })
    } else if (userRole === "admin") {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("verified", "==", true))
      unsubscribeQuery = onSnapshot(q, (snapshot) => {
        const verifiedUsers: Notification[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          const userId = doc.id
          if (!acknowledgedVerifiedUsers.includes(userId) && !verifiedUsers.some((u) => u.id === userId)) {
            verifiedUsers.push({ id: userId, email: data.email, name: data.name, role: data.role })
          }
        })

        setVerifiedUserNotifications(verifiedUsers)
        setVerifiedUserCount(verifiedUsers.length)
        setNotifications(verifiedUsers)
        setUnreadCount(verifiedUsers.length)
      })
    }

    return () => unsubscribeQuery && unsubscribeQuery()
  }, [userId, userRole, instructorIds, studentIds, acknowledgedVerifiedUsers])

  const renderNotifications = () => {
    if (userRole === "student") {
      return (
        <>
          {instructorNotifications.map((notif, index) => (
            <div key={index} className="flex items-start gap-3 p-3 hover:bg-accent transition-colors border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircleIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New message from instructor {notif.sender}</p>
                <p className="text-xs text-muted-foreground">{truncateMessage(notif.message)}</p>
                <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 text-xs"
                  onClick={() => markAsRead(notif)}
                >
                  Mark as read
                </Button>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
            </div>
          ))}
          {teamNotifications.map((notif, index) => (
            <div key={index} className="flex items-start gap-3 p-3 hover:bg-accent transition-colors border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <UsersIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New team message from {notif.sender}</p>
                <p className="text-xs text-muted-foreground">{truncateMessage(notif.message)}</p>
                <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 text-xs"
                  onClick={() => markAsRead(notif)}
                >
                  Mark as read
                </Button>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
            </div>
          ))}
        </>
      )
    } else if (userRole === "instructor") {
      return notifications.map((notif, index) => (
        <div key={index} className="flex items-start gap-3 p-3 hover:bg-accent transition-colors border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <MessageCircleIcon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">New message from {notif.sender}</p>
            <p className="text-xs text-muted-foreground">{truncateMessage(notif.message)}</p>
            <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 text-xs"
              onClick={() => markAsRead(notif)}
            >
              Mark as read
            </Button>
          </div>
          <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
        </div>
      ))
    } else if (userRole === "admin") {
      return verifiedUserNotifications.map((notif, index) => (
        <div key={index} className="flex items-start gap-3 p-3 hover:bg-accent transition-colors border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <UsersIcon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">New verified user</p>
            <p className="text-xs text-muted-foreground">{notif.name} ({notif.email})</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 text-xs"
              onClick={() => markAsRead(notif)}
            >
              Mark as read
            </Button>
          </div>
          <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
        </div>
      ))
    }
    return <p className="p-3 text-sm text-muted-foreground">No new notifications</p>
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover border border-border text-popover-foreground">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h4 className="font-semibold">Notifications</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">{renderNotifications()}</div>
        <div className="border-t border-border p-2">
          {unreadCount === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No new notifications</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}