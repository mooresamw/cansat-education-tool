'use client';

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { StudentProgressTable } from "@/components/StudentProgressTable";

export default function InstructorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [instructorName, setInstructorName] = useState<string | null>(null);
  const [clockLogs, setClockLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const loginResponse = await fetch("http://localhost:8080/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });

          if (!loginResponse.ok) {
            console.error("Failed to log login activity:", await loginResponse.json());
          } else {
            const loginData = await loginResponse.json();
            console.log("Login logged successfully:", loginData);
          }

          const response = await fetch("http://127.0.0.1:8080/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });
          const data = await response.json();
          if (data.role === "student") {
            router.push('/dashboard/student/');
          } else if (data.role === "admin") {
            router.push('/admin');
          } else if (data.role === "instructor") {
            setUserRole(data.role);
            setInstructorName(user.displayName || "Instructor");
          } else {
            throw new Error("Invalid role");
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleClockInOut = async () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      console.error("No authentication token available");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: token,
          action: isClockedIn ? "out" : "in"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record clock action");
      }

      const data = await response.json();
      const logMessage = `${data.message} at ${timeString} on ${dateString}`;
      setClockLogs((prevLogs) => [logMessage, ...prevLogs]);
      setIsClockedIn((prev) => !prev);
    } catch (error) {
      console.error("Error recording clock action:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <DashboardLayout userType="instructor">
      <h1 className="text-2xl font-bold mb-6">Instructor Dashboard</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Access Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/dashboard/student/training-materials")}>View Training Resources</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle
                  className="cursor-pointer hover:underline"
                  onClick={() => setActiveTab("time-tracking")}
                >
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleClockInOut}>
                  {isClockedIn ? "Clock Out" : "Clock In"}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Student Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/dashboard/instructor/message")}>Open Chat</Button>
              </CardContent>
            </Card>
          </div>
          <StudentProgressTable />
        </TabsContent>
        <TabsContent value="time-tracking">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {clockLogs.map((log, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {log}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}