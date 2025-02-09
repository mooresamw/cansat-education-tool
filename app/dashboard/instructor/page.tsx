import { DashboardLayout} from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {checkUserRole} from "@/lib/checkAuth";

export default function InstructorDashboard() {
  //User Redirection
  const userRole = checkUserRole(["admin", "instructor"])//Admin and Instructor have access
  if(!userRole) return <p>Loading...</p>//Show loading until redirect happens

  return (
    <DashboardLayout userType="instructor">
      <h1 className="text-2xl font-bold mb-6">Instructor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>View Training Resources</Button>
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
            <Button>Open Chat</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}