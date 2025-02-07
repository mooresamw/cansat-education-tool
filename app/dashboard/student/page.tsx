import { DashboardLayout} from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentDashboard() {
  return (
    <DashboardLayout userType="student">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>View Training Videos</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Virtual Arduino IDE</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Open IDE</Button>
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