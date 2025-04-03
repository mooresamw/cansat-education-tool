"use client"

import { useEffect, useState, useRef } from "react"
import { auth, db } from "@/lib/firebaseConfig"
import { collection, getDocs, query, where } from "firebase/firestore"
import { FiMessageCircle, FiSend } from "react-icons/fi"
import {
  sendMessage,
  handleReaction,
  handleEditMessage,
  getMessages,
  markMessageAsRead,
} from "@/lib/firestoreUtil";
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
import { Plus, Users } from "lucide-react"
import { addDoc, updateDoc, arrayUnion, doc } from "firebase/firestore"

export default function StudentChatPage() {

  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [loading, setLoading] = useState(true)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [joinGroupOpen, setJoinGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [instructorEmail, setInstructorEmail] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [groups, setGroups] = useState<any[]>([])

  // Fetch the currently authenticated user (student) and their data
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

  // Fetch students from the same school, excluding the current user
  useEffect(() => {
    async function fetchStudents() {
      if (!user || !user.school_id) return

      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("school_id", "==", user.school_id),
      )
      const snapshot = await getDocs(studentsQuery)
      const studentsList = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            uid: data.user_id,
            ...data,
          }
        })
        .filter((student) => student.uid !== user.uid)

      // Get all groups to check which students are already in groups
      const groupsQuery = query(collection(db, "groups"), where("school_id", "==", user.school_id))
      const groupsSnapshot = await getDocs(groupsQuery)
      const allGroups = groupsSnapshot.docs.map((doc) => doc.data())

      // Mark students who are already in groups
      studentsList.forEach((student) => {
        student.inGroup = allGroups.some(
          (group) =>
            group.members &&
            group.members.some((member: any) =>
              typeof member === "string" ? member === student.uid : member.user_id === student.uid,
            ),
        )
      })

      setStudents(studentsList)
    }
    fetchStudents()
  }, [user])

  // 3. Real-time listener for messages with mark-as-read logic
  useEffect(() => {
    if (selectedStudent && user) {
      const unsubscribe = getMessages(
        user.user_id,
        selectedStudent.user_id,
        (newMessages: any[]) => {
          setMessages(newMessages);
          newMessages.forEach((msg) => {
            if (msg.sender !== user.uid && msg.read?.[user.uid] !== true) {
              markMessageAsRead(
                user.user_id,
                [user.user_id, selectedStudent.user_id].sort().join("_"),
                msg.messageId
              );
            }
          });
        }
      );
      return () => unsubscribe();
    }
  }, [selectedStudent, user]);

  useEffect(() => {
    async function fetchGroups() {
      if (!user || !user.school_id) return

      const groupsQuery = query(collection(db, "groups"), where("school_id", "==", user.school_id))
      const snapshot = await getDocs(groupsQuery)
      const groupsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setGroups(groupsList)
    }

    if (user) {
      fetchGroups()
    }
  }, [user])

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !instructorEmail.trim() || selectedMembers.length === 0) {
      alert("Please fill all fields and select at least one member")
      return
    }

    try {
      // Check if the current user is already in any group
      const userInGroup = groups.some((group) => {
        return (
          group.members &&
          group.members.some((member: any) =>
            typeof member === "string" ? member === user.uid : member.user_id === user.uid,
          )
        )
      })

      if (userInGroup) {
        alert("You are already a member of a group. You can only belong to one group at a time.")
        return
      }

      // Check if any selected members are already in groups
      const selectedMembersInGroups = students
        .filter((student) => selectedMembers.includes(student.uid) && student.inGroup)
        .map((student) => student.name)

      if (selectedMembersInGroups.length > 0) {
        alert(`The following students are already in groups: ${selectedMembersInGroups.join(", ")}`)
        return
      }

      // Create the members array with user_id and joined_at timestamp
      const currentTimestamp = new Date()
      const members = [
        ...selectedMembers.map((memberId: string) => ({
          user_id: memberId,
          joined_at: currentTimestamp,
        })),
        // Add the current user (creator) to the members list
        {
          user_id: user.uid,
          joined_at: currentTimestamp,
        },
      ]

      // Create the group in Firestore with the updated members schema
      await addDoc(collection(db, "groups"), {
        name: groupName,
        instructor_email: instructorEmail,
        members,
        school_id: user.school_id,
        created_at: currentTimestamp,
        created_by: user.uid,
      })

      // Reset form and close dialog
      setGroupName("")
      setInstructorEmail("")
      setSelectedMembers([])
      setCreateGroupOpen(false)

      // Refresh groups list and student list (to update inGroup status)
      await refreshGroupsAndStudents()

      alert("Group created successfully!")
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group. Please try again.")
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      // Check if the user is already in any group
      const userInGroup = groups.some((group) => {
        return (
          group.members &&
          group.members.some((member: any) =>
            typeof member === "string" ? member === user.uid : member.user_id === user.uid,
          )
        )
      })

      if (userInGroup) {
        alert("You are already a member of a group. You can only belong to one group at a time.")
        return
      }

      // Update the group document to add the current user to members
      const groupRef = doc(db, "groups", groupId)
      const currentTimestamp = new Date()

      await updateDoc(groupRef, {
        members: arrayUnion({
          user_id: user.uid,
          joined_at: currentTimestamp,
        }),
      })

      // Refresh groups list and student list
      await refreshGroupsAndStudents()

      setJoinGroupOpen(false)
      alert("You have joined the group successfully!")
    } catch (error) {
      console.error("Error joining group:", error)
      alert("Failed to join group. Please try again.")
    }
  }

  const toggleMemberSelection = (studentId: string) => {
    if (selectedMembers.includes(studentId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== studentId))
    } else {
      setSelectedMembers([...selectedMembers, studentId])
    }
  }

  // Send a message
  const handleSendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send a message.")
      return
    }
    if (selectedStudent && message.trim()) {
      if (selectedStudent.school_id !== user.school_id) {
        alert("You can only message students from your school.")
        return
      }
      try {
        await sendMessage(user.uid, selectedStudent.id, message)
        setMessage("")
      } catch (error) {
        console.error("Error sending message:", error)
        alert("Failed to send message.")
      }
    } else {
      alert("Please select a student and type a message.")
    }
  }

  // Reaction handler
  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!user || !selectedStudent) return
    try {
      await handleReaction(user.uid, selectedStudent.id, messageId, emoji)
    } catch (error) {
      console.error("Error updating reaction:", error)
      alert("Failed to update reaction.")
    }
  }

  // Edit message handler
  const handleEditMessageClick = async (messageId: string, newText: string) => {
    if (!user || !selectedStudent) return
    try {
      await handleEditMessage(user.uid, selectedStudent.id, messageId, newText)
      setEditingMessageId(null)
    } catch (error) {
      console.error("Error editing message:", error)
      alert("Failed to edit message.")
    }
  }

  // Scroll to bottom on messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const refreshGroupsAndStudents = async () => {
    // Refresh groups list
    const groupsQuery = query(collection(db, "groups"), where("school_id", "==", user.school_id))
    const groupsSnapshot = await getDocs(groupsQuery)
    const groupsList = groupsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    setGroups(groupsList)

    // Refresh students list to update inGroup status
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
          ...data,
        }
      })
      .filter((student) => student.uid !== user.uid)

    // Mark students who are already in groups
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

  if (loading) return <Loading />
  return (
    <DashboardLayout userType={user.role}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-card text-primary shadow-md py-4 px-6">
          <h1 className="text-2xl font-bold">Message a Student From {user.school_name.split(",")[0]}</h1>
        </header>

        <div className="flex flex-1 overflow-hidden bg-gray-50">
        {/* Sidebar: Students List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 bg-card shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Students</h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-card">
              {(() => {
                // Find the group(s) the current user is a member of
                const userGroups = groups.filter((group) =>
                  group.members?.some((member: { user_id: string; joined_at: any }) => member.user_id === user.uid)
                )

                // If the user is not in any group, show a message
                if (userGroups.length === 0) {
                  return (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">You are not in any group. Join or create a group to see members.</p>
                    </div>
                  )
                }

                // Get the members of the group(s) the user is in
                const groupMemberIds = userGroups
                  .flatMap((group) => group.members?.map((member: { user_id: string; joined_at: any }) => member.user_id) || [])
                  .filter((id: string) => id !== user.uid) // Exclude the current user from the list

                // Filter students to only include those in the same group(s)
                const groupStudents = students.filter((student) => groupMemberIds.includes(student.id))

                // If there are no other students in the group, show a message
                if (groupStudents.length === 0) {
                  return (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">No other students in your group.</p>
                    </div>
                  )
                }

                // Render the filtered list of students
                return groupStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`flex bg-card items-center p-4 space-x-3 cursor-pointer transition-colors duration-150 ${
                      selectedStudent?.id === student.id
                        ? "bg-accent border-l-4 border-blue-500"
                        : "hover:bg-accent border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {student.name?.[0]?.toUpperCase() || "S"}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary truncate">{student.name}</p>
                      <p className="text-xs text-gray-500 truncate">{student.email || "Student"}</p>
                    </div>
                    <FiMessageCircle className="h-5 w-5 text-gray-400" />
                  </div>
                ))
              })()}
            </div>
            <div className="flex justify-end space-x-4 px-6 py-2 bg-card border-b border-border">
              <Button variant="outline" onClick={() => setCreateGroupOpen(true)} className="flex items-center gap-2">
                <Plus size={16} />
                Create Group
              </Button>
              <Button variant="outline" onClick={() => setJoinGroupOpen(true)} className="flex items-center gap-2">
                <Users size={16} />
                Join Group
              </Button>
          </div>
        </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedStudent ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-card p-4 shadow-sm flex items-center space-x-3">
                    <div
                        className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xl">
                      {selectedStudent.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                    <h2 className="text-lg font-semibold text-primary">{selectedStudent.name}</h2>
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      Active now
                    </span>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                      <FiMessageCircle className="h-12 w-12" />
                      <p className="text-lg">No messages yet</p>
                      <p className="text-sm">Start a conversation with {selectedStudent.name}</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSender = msg.sender === user?.uid
                      return (
                        <div
                          key={msg.messageId}
                          className={`flex items-end ${isSender ? "justify-end" : "justify-start"}`}
                        >
                          {!isSender && (
                            <div className="mr-2 flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                                {selectedStudent.name?.[0]?.toUpperCase() || "S"}
                              </div>
                            </div>
                          )}

                          <div
                            className={`relative max-w-sm p-4 rounded-3xl shadow-lg transition-all duration-200 ${
                              isSender ? "bg-blue-500 text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm"
                            }`}
                          >
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
                                  className={`text-sm px-1 rounded-full ${isSender ? "bg-blue-600/20" : "bg-gray-200"}`}
                                >
                                  {emoji as string}
                                </span>
                              ))}
                            </div>
                          </div>

                          {isSender && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm">
                                {user?.name?.[0] || "Y"}
                              </div>
                            </div>
                          )}
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
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="max-w-md text-center space-y-4">
                  <FiMessageCircle className="h-16 w-16 text-gray-300 mx-auto" />
                  <h3 className="text-xl font-semibold text-gray-900">Select a student</h3>
                  <p className="text-gray-500">
                    Choose a student from the list to view messages and start a conversation
                  </p>
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
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students available</p>
                ) : (
                  <div className="space-y-2">
                    {students
                      .filter((student) => !student.inGroup)
                      .map((student) => (
                        <div key={student.uid} className="flex items-center space-x-2">
                          <Checkbox
                            id={`student-${student.uid}`}
                            checked={selectedMembers.includes(student.uid)}
                            onCheckedChange={() => toggleMemberSelection(student.uid)}
                          />
                          <Label htmlFor={`student-${student.uid}`} className="flex items-center gap-2 cursor-pointer">
                            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
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
                  // Check if user is a member of this group
                  const isMember =
                    group.members &&
                    group.members.some((member: any) =>
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
                          <Button
                            size="sm"
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={groups.some(
                              (g) =>
                                g.members &&
                                g.members.some((member: any) =>
                                  typeof member === "string" ? member === user.uid : member.user_id === user.uid,
                                ),
                            )}
                          >
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
                                <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px]">
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