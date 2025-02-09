'use client'

import { DashboardLayout} from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {checkUserRole} from "@/lib/checkAuth";

export default function AdminDashboard() {
  //User Redirection
  const userRole = checkUserRole(["admin"]); //Admin only has access to dashboard
  if (!userRole) return <p>Loading...</p> //Show loading until redirect happens

  return (
    <DashboardLayout userType="admin">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Create New Account</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>View Activity Logs</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resource Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Upload Training Materials</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}