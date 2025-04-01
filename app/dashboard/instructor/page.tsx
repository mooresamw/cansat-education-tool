"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkUserRole } from "@/lib/checkAuth";
import { useRouter } from "next/navigation";
import { db, auth, getStudents } from "@/lib/firebaseConfig";
import { collection, query, where, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { IoIosNotifications } from "react-icons/io";
import { HiBookOpen, HiClock, HiChatAlt } from "react-icons/hi";
import { markMessageAsRead } from "@/lib/firestoreUtil";
import { StudentProgressTable } from "@/components/StudentProgressTable";

interface ClockHistoryEntry {
  id: string;
  userId: string;
  action: "in" | "out";
  timestamp: any;
  clockInTimestamp?: any;
  duration?: number;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [studentUnreadCount, setStudentUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockHistory, setClockHistory] = useState<ClockHistoryEntry[]>([]);
  const [showClockHistory, setShowClockHistory] = useState(false);
  const [currentSessionDuration, setCurrentSessionDuration] = useState(0);

  // Fetch authenticated user and role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        setUserId(uid);
        const token = await user.getIdToken();
        console.log("Firebase Token:", token);
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

  // Fetch clock-in/out history
  useEffect(() => {
    if (!userId) return;

    const clockRef = collection(db, "clockHistory");
    const q = query(clockRef, where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history: ClockHistoryEntry[] = [];
      snapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as ClockHistoryEntry);
      });
      setClockHistory(history.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds));

      const lastEntry = history[0];
      if (lastEntry && lastEntry.action === "in" && !lastEntry.clockOutTimestamp) {
        setIsClockedIn(true);
        const startTime = new Date(lastEntry.timestamp.seconds * 1000);
        const now = new Date();
        setCurrentSessionDuration(Math.floor((now.getTime() - startTime.getTime()) / 1000));
      } else {
        setIsClockedIn(false);
        setCurrentSessionDuration(0);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Update current session duration every second if clocked in
  useEffect(() => {
    if (!isClockedIn) return;

    const interval = setInterval(() => {
      setCurrentSessionDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn]);

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

      const clockData = {
        userId,
        action,
        timestamp: Timestamp.fromDate(new Date()),
      };

      if (action === "out") {
        const lastClockIn = clockHistory.find((entry) => entry.action === "in" && !entry.clockOutTimestamp);
        if (lastClockIn) {
          clockData.clockInTimestamp = lastClockIn.timestamp;
          const duration = Math.floor(
            (new Date().getTime() - lastClockIn.timestamp.toDate().getTime()) / 1000
          );
          clockData.duration = duration;
        }
      }

      await addDoc(collection(db, "clockHistory"), clockData);
      setIsClockedIn(!isClockedIn);
    } catch (error) {
      console.error(`Error during clock ${action}:`, error);
    }
  };

  // Format duration in hours, minutes, seconds
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
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

  // Handle opening clock history in a new tab
  const handleViewHistoryInNewTab = () => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Clock-In/Out History</title>
            <style>
              body { background-color: #000; color: #fff; font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #444; }
              th { background-color: #222; }
              .close-btn { background-color: #ccc; color: #000; padding: 8px 16px; border: none; cursor: pointer; }
              .close-btn:hover { background-color: #aaa; }
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
                    const clockInTime = entry.clockInTimestamp?.toDate();
                    const clockOutTime = entry.timestamp.toDate();
                    return `
                      <tr>
                        <td>${clockInTime?.toLocaleDateString()}</td>
                        <td>${clockInTime?.toLocaleTimeString()}</td>
                        <td>${clockOutTime?.toLocaleTimeString()}</td>
                        <td>${entry.duration ? formatDuration(entry.duration) : "N/A"}</td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
            <button class="close-btn" onclick="window.close()">Close Tab</button>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  if (loading) {
    return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <DashboardLayout userType="instructor">
        <main className="max-w-6xl mx-auto w-full px-4 py-12 relative">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Instructor Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <Card className="bg-card border border-border rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiClock className="text-3xl text-green-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-primary text-xl">Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Track your time spent on instruction and support.
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleClockAction}
                    className={`bg-white text-black hover:bg-gray-200 ${isClockedIn ? "bg-white text-black hover:bg-gray-200" : ""}`}
                  >
                    {isClockedIn ? "Clock Out" : "Clock In"}
                  </Button>
                  <Button
                    onClick={() => setShowClockHistory(true)}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    View History
                  </Button>
                </div>
                {isClockedIn && (
                  <p className="text-gray-400 text-sm mt-2">
                    Current Session: {formatDuration(currentSessionDuration)}
                  </p>
                )}
              </CardContent>
            </Card>

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

          <div className="mt-6">
            <StudentProgressTable />
          </div>

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

          {showClockHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
              <div className="bg-gray-900 border border-gray-800 rounded-md p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Clock-In/Out History</h3>
                  <div className="space-x-2">
                    <Button
                      onClick={handleViewHistoryInNewTab}
                      className="bg-gray-200 text-black hover:bg-gray-300"
                    >
                      View in New Tab
                    </Button>
                    <Button
                      onClick={() => setShowClockHistory(false)}
                      className="bg-gray-200 text-black hover:bg-gray-300"
                    >
                      Close
                    </Button>
                  </div>
                </div>
                {clockHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-700 text-white">
                          <th className="py-2">Date</th>
                          <th className="py-2">Clock-In</th>
                          <th className="py-2">Clock-Out</th>
                          <th className="py-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clockHistory.map((entry, index) => {
                          if (entry.action === "out") {
                            const clockInTime = entry.clockInTimestamp?.toDate();
                            const clockOutTime = entry.timestamp.toDate();
                            return (
                              <tr key={index} className="border-b border-gray-800 text-white">
                                <td className="py-2">{clockInTime?.toLocaleDateString()}</td>
                                <td className="py-2">{clockInTime?.toLocaleTimeString()}</td>
                                <td className="py-2">{clockOutTime?.toLocaleTimeString()}</td>
                                <td className="py-2">{entry.duration ? formatDuration(entry.duration) : "N/A"}</td>
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400">No clock-in/out history available.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </DashboardLayout>
    </div>
  );
}