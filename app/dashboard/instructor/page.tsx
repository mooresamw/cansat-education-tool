"use client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkUserRole } from "@/lib/checkAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { StudentProgressTable } from "@/components/StudentProgressTable";

export default function InstructorDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [UserRole, setUserRole] = useState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get the token
        const token = await user.getIdToken();
        // console.log("Firebase Token:", token);

        const response = await fetch("http://127.0.0.1:8080/check-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });
        const data = await response.json();
        if (data.role == "student") {
          router.push("/dashboard/student/");
        } else {
          setUserRole(data.role);
        }
      } else {
        // User is not signed in, redirect to login
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  return (
    <DashboardLayout userType="instructor">
      <h1 className="text-2xl font-bold mb-6">Instructor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/student/training-materials")}>
              View Training Resources
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Clock In/Out</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Communication</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/instructor/message")}>
              Open Chat
            </Button>
          </CardContent>
        </Card>
      </div>
      <StudentProgressTable />
    </DashboardLayout>
  );
}
