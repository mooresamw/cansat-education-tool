"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkUserRole } from "@/lib/checkAuth";
import { useRouter } from "next/navigation";
import { db, auth, getStudents } from "@/lib/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { IoIosNotifications } from "react-icons/io";
import { HiBookOpen, HiClock, HiChatAlt } from "react-icons/hi";
import { markMessageAsRead } from "@/lib/firestoreUtil";
import { StudentProgressTable } from "@/components/StudentProgressTable";

export default function InstructorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [studentUnreadCount, setStudentUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false); // New state for clock status

  // Fetch authenticated user and role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        setUserId(uid);
        const token = await user.getIdToken();
        console.log("Firebase Token:", token);

        // Notify backend of login (optional, based on your previous requirement)
        try {
          const loginResponse = await fetch("http://127.0.0.1:8080/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });
          if (!loginResponse.ok) {
            console.error("Login logging failed:", await loginResponse.text());
          }
        } catch (error) {
          console.error("Error notifying backend of login:", error);
        }

        const response = await fetch("http://127.0.0.1:8080/check-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });
        const data = await response.json();
        if (data.role === "student") {
          router.push("/dashboard/student/");
        } else {
          setUserRole(data.role);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch students (to identify student messages)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const students = await getStudents();
        const ids = students.map((student: any) => student.user_id);
        setStudentIds(ids);
        console.log("Student IDs:", ids);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!userRole || userRole !== "instructor") {
      console.log("User role is not instructor or not authenticated:", userRole);
      return;
    }

    if (!userId) {
      console.log("No userId available yet");
      return;
    }

    if (studentIds.length === 0) {
      console.log("Student IDs not yet loaded");
      return;
    }

    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, where("participants", "array-contains", userId));

    const unsubscribeQuery = onSnapshot(
      q,
      (snapshot) => {
        let studentUnread = 0;
        const studentMessages: any[] = [];
        const allMessages: any[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const conversationId = doc.id;
          const messages = data.messages || [];
          const otherParticipants = data.participants.filter((id: string) => id !== userId);
          const involvesStudent = otherParticipants.some((id: string) => studentIds.includes(id));

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
                involvesStudent,
              };

              allMessages.push(messageData);

              if (involvesStudent) {
                studentUnread++;
                studentMessages.push(messageData);
              }
            }
          });
        });

        console.log("Student Unread Count:", studentUnread);
        console.log("Student Unread Messages:", studentMessages);
        console.log("All Unread Messages:", allMessages);

        setStudentUnreadCount(studentUnread);
        setNotifications(allMessages);
      },
      (error) => {
        console.error("Error in onSnapshot Query:", error);
      }
    );

    return () => unsubscribeQuery();
  }, [userRole, userId, studentIds]);

  // Handle Clock In/Out
  const handleClockAction = async () => {
    if (!userId) {
      console.error("No userId available for clock action");
      return;
    }

    const action = isClockedIn ? "out" : "in";
    const token = await auth.currentUser?.getIdToken();

    try {
      const response = await fetch("http://127.0.0.1:8080/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token, action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to clock ${action}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log(`Clock ${action} successful:`, data);

      // Toggle the clock state
      setIsClockedIn(!isClockedIn);
    } catch (error) {
      console.error(`Error during clock ${action}:`, error);
    }
  };

  // Notification handlers
  const handleBellClick = () => setShowNotifications((prev) => !prev);

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

  if (loading) {
    return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <DashboardLayout userType="instructor">
        <main className="max-w-6xl mx-auto w-full px-4 py-12 relative">
          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Instructor Dashboard</h1>

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Access Materials */}
            <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiBookOpen className="text-3xl text-blue-500 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-primary text-xl">Access Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  View and manage training resources for your students.
                </p>
                <Button
                  onClick={() => router.push("/dashboard/student/training-materials")}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  View Training Resources
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: Time Tracking */}
            <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiClock className="text-3xl text-green-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-primary text-xl">Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Track your time spent on instruction and support.
                </p>
                <Button
                  onClick={handleClockAction}
                  className={`bg-white text-black hover:bg-gray-200 ${isClockedIn ? "bg-white text-black hover:bg-gray-200" : ""}`}
                >
                  {isClockedIn ? "Clock Out" : "Clock In"}
                </Button>
              </CardContent>
            </Card>

            {/* Card 3: Student Communication */}
            <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiChatAlt className="text-3xl text-purple-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-primary text-xl">Student Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Communicate directly with your students.
                </p>
                <Button
                  onClick={() => router.push("/dashboard/instructor/message")}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Open Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Student Progress Table */}
          <div className="mt-6">
            <StudentProgressTable />
          </div>

          {/* Bell Icon */}
          <div
            onClick={handleBellClick}
            className="fixed top-4 right-16 bg-blue-500 text-white rounded-full cursor-pointer shadow-lg flex items-center justify-center w-10 h-10"
          >
            <IoIosNotifications size={20} />
            {studentUnreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {studentUnreadCount}
              </span>
            )}
          </div>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="fixed top-14 right-16 bg-gray-900 border border-gray-800 shadow-lg rounded-md p-4 w-72 z-10">
              <h3 className="font-bold text-lg text-white">Unread Messages</h3>
              {notifications.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {notifications.map((notification, index) => (
                    <li key={index} className="p-2 bg-gray-800 rounded">
                      <p className="text-sm text-white">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        From: {notification.sender} (Student)
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