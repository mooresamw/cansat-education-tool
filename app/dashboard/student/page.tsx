'use client'
import { DashboardLayout} from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {checkUserRole} from "@/lib/checkAuth";
import {router, useRouter} from "next/navigation";
import Link from "next/link";

export default function StudentDashboard() {
  const userRole = checkUserRole(["admin", "instructor", "student"]);
  if(!userRole) return <p>Loading...</p>//Show loading until redirect happens

  const router = useRouter();
  const openIDE = () => {
    router.push("/dashboard/student/ide")
  }
  return (
    <DashboardLayout userType="student">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/student/training-materials">
              <Button>View Training Materials</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Virtual Arduino IDE</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => openIDE()}>Open IDE</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Collaboration Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Join Team Chat</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Direct Messaging</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Message Instructor</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}