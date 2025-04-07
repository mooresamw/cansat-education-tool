// app/dashboard/student/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkUserRole } from "@/lib/checkAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth, getInstructors } from "@/lib/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { IoIosNotifications } from "react-icons/io";
import { HiBookOpen, HiChip, HiChatAlt, HiMail } from "react-icons/hi";
import { markMessageAsRead } from "@/lib/firestoreUtil";

export default function StudentDashboard() {
  const userRole = checkUserRole(["admin", "instructor", "student"]);
  const [instructorUnreadCount, setInstructorUnreadCount] = useState(0);
  const [teamUnreadCount, setTeamUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [instructorNotifications, setInstructorNotifications] = useState<any[]>([]);
  const [teamNotifications, setTeamNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [instructorIds, setInstructorIds] = useState<string[]>([]);

  const router = useRouter();

  // Fetch instructor IDs
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const instructors = await getInstructors();
        const ids = instructors.map((instructor: any) => instructor.uid);
        setInstructorIds(ids);
        console.log("Instructor IDs:", ids);
      } catch (error) {
        console.error("Error fetching instructors:", error);
      }
    };

    fetchInstructors();
  }, []);

  // Authentication state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          const uid = user.uid;
          setUserId(uid);
          setLoading(false);
          console.log("User authenticated, UID:", uid);
          localStorage.setItem("userId", uid);
        } else {
          console.log("No user is authenticated");
          setUserId(null);
          setLoading(false);
          router.push("/login");
        }
      },
      (error) => {
        console.error("Error in onAuthStateChanged:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeAuth();
  }, [router]);

  // Real-time notifications listener
  useEffect(() => {
    if (!userRole || userRole !== "student") {
      console.log("User role is not student or not authenticated:", userRole);
      return;
    }

    if (!userId) {
      console.log("No userId available yet");
      return;
    }

    if (instructorIds.length === 0) {
      console.log("Instructor IDs not yet loaded");
      return;
    }

    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, where("participants", "array-contains", userId));

    const unsubscribeQuery = onSnapshot(
      q,
      (snapshot) => {
        let instructorUnread = 0;
        let teamUnread = 0;
        const instructorMessages: any[] = [];
        const teamMessages: any[] = [];
        const allMessages: any[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const conversationId = doc.id;
          const messages = data.messages || [];
          const otherParticipants = data.participants.filter((id: string) => id !== userId);
          const involvesInstructor = otherParticipants.some((id: string) => instructorIds.includes(id));
          const otherParticipantId = otherParticipants[0]; // Assuming 1:1 chat

          messages.forEach((msg: any) => {
            const readStatus = msg.read || {};
            const isUnread = msg.sender !== userId && readStatus[userId] !== true;

            if (isUnread) {
              const messageData = {
                message: msg.message,
                sender: msg.sender,
                timestamp: msg.timestamp,
                messageId: msg.messageId,
                participants: data.participants,
                conversationId: conversationId,
                involvesInstructor,
              };

              allMessages.push(messageData);

              if (involvesInstructor) {
                instructorUnread++;
                instructorMessages.push(messageData);
              } else {
                teamUnread++;
                teamMessages.push(messageData);
              }
            }
          });
        });

        console.log("Instructor unread count:", instructorUnread);
        console.log("Team unread count:", teamUnread);
        console.log("All messages after filtering:", allMessages);

        setInstructorUnreadCount(instructorUnread);
        setTeamUnreadCount(teamUnread);
        setInstructorNotifications(instructorMessages);
        setTeamNotifications(teamMessages);
        setNotifications(allMessages);
      },
      (error) => {
        console.error("Error in onSnapshot Query:", error);
      }
    );

    return () => unsubscribeQuery();
  }, [userRole, userId, instructorIds]);

  // Navigation handlers
  const openIDE = () => router.push("/dashboard/student/ide");
  const goToChat = () => router.push("/dashboard/student/messageStudent");
  const messageInstructor = () => router.push("/dashboard/student/message");

  // Notification toggle
  const handleBellClick = () => setShowNotifications((prev) => !prev);

  // Mark message as read
  const handleMarkAsRead = async (notification: any) => {
    if (!userId) {
      console.error("No userId available to mark message as read");
      return;
    }

    try {
      const { conversationId, messageId } = notification;
      if (!conversationId || !messageId) {
        console.error("Missing conversationId or messageId in notification data");
        return;
      }

      await markMessageAsRead(userId, conversationId, messageId);
      console.log(`Marked message ${messageId} as read for user ${userId}`);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // Character limit for notification preview
  const MESSAGE_PREVIEW_LIMIT = 25;

  // Function to truncate message if it exceeds the limit
  const truncateMessage = (message: string) => {
    if (message.length > MESSAGE_PREVIEW_LIMIT) {
      return message.slice(0, MESSAGE_PREVIEW_LIMIT) + "...";
    }
    return message;
  };

  if (loading) {
    return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>;
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="bg-black min-h-screen text-primary">
      <DashboardLayout userType="student">
        <main className="max-w-6xl mx-auto w-full px-4 py-12 relative">
          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Student Dashboard</h1>

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-gray-400 text-sm mb-4">
                  Chat and collaborate with teammates in real time.
                </p>
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
                        From: {notification.sender} (
                        {notification.involvesInstructor ? "Instructor" : "Team"})
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleString()}
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
              ) : (
                <p className="text-sm text-gray-400 mt-2">No unread messages</p>
              )}
            </div>
          )}
        </main>
      </DashboardLayout>
    </div>
  );
}