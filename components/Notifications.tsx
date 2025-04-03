"use client"

import React, { useEffect, useState } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { Timestamp } from "firebase/firestore" // Import Timestamp for type checking
import { db } from "@/lib/firebaseConfig"
import { Bell, MessageCircleIcon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface NotificationsProps {
  userId: string
  userRole: "admin" | "instructor" | "student"
}

export function Notifications({ userId, userRole }: NotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [instructorNotifications, setInstructorNotifications] = useState<any[]>([])
  const [teamNotifications, setTeamNotifications] = useState<any[]>([])
  const [instructorUnreadCount, setInstructorUnreadCount] = useState(0)
  const [teamUnreadCount, setTeamUnreadCount] = useState(0)
  const [studentUnreadCount, setStudentUnreadCount] = useState(0)
  const [verifiedUserNotifications, setVerifiedUserNotifications] = useState<any[]>([])
  const [verifiedUserCount, setVerifiedUserCount] = useState(0)

  const [instructorIds, setInstructorIds] = useState<string[]>([])
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [acknowledgedVerifiedUsers, setAcknowledgedVerifiedUsers] = useState<string[]>([])

  // Helper function to format timestamp
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
      const messagesRef = collection(db, "messages")
      const q = query(messagesRef, where("participants", "array-contains", userId))
      unsubscribeQuery = onSnapshot(q, (snapshot) => {
        let instructorUnread = 0
        let teamUnread = 0
        const instructorMessages: any[] = []
        const teamMessages: any[] = []
        const allMessages: any[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          const messages = data.messages || []
          const otherParticipants = data.participants.filter((id: string) => id !== userId)
          const involvesInstructor = otherParticipants.some((id: string) => instructorIds.includes(id))

          messages.forEach((msg: any) => {
            const readStatus = msg.read || {}
            const isUnread = msg.sender !== userId && readStatus[userId] !== true
            if (isUnread) {
              const messageData = {
                message: msg.message,
                timestamp: formatTimestamp(msg.timestamp), // Use the helper function
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
      const messagesRef = collection(db, "messages")
      const q = query(messagesRef, where("participants", "array-contains", userId))
      unsubscribeQuery = onSnapshot(q, (snapshot) => {
        let studentUnread = 0
        const allMessages: any[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          const messages = data.messages || []
          const otherParticipants = data.participants.filter((id: string) => id !== userId)
          const involvesStudent = otherParticipants.some((id: string) => studentIds.includes(id))

          messages.forEach((msg: any) => {
            const readStatus = msg.read || {}
            const isUnread = msg.sender !== userId && readStatus[userId] !== true
            if (isUnread) {
              const messageData = {
                message: msg.message,
                timestamp: formatTimestamp(msg.timestamp), // Use the helper function
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
        const verifiedUsers: any[] = []
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
                <p className="text-sm font-medium">New message from instructor</p>
                <p className="text-xs text-muted-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            </div>
          ))}
          {teamNotifications.map((notif, index) => (
            <div key={index} className="flex items-start gap-3 p-3 hover:bg-accent transition-colors border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <UsersIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New team message</p>
                <p className="text-xs text-muted-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
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
            <p className="text-sm font-medium">New message from</p>
            <p className="text-xs text-muted-foreground">{notif.message}</p>
            <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-primary"></div>
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
          </div>
          <div className="h-2 w-2 rounded-full bg-primary"></div>
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
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Mark all as read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">{renderNotifications()}</div>
        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs justify-center">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}