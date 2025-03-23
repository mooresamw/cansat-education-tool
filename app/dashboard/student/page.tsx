'use client'
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { checkUserRole } from "@/lib/checkAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentDashboard() {
  const userRole = checkUserRole(["admin", "instructor", "student"]);
  if (!userRole) return <p>Loading...</p>; // Show loading until redirect happens

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // User is signed in, get the token
          const token = await user.getIdToken();
          // Log the login action
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

          // Check user role
          const response = await fetch("http://127.0.0.1:8080/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });
          const data = await response.json();
          
          if (data.role === "instructor") {
            router.push('/dashboard/instructor');
          } else if (data.role === "admin") {
            router.push('/admin');
          } else if (data.role === "student") {
            setUserRole(data.role);
          } else {
            throw new Error("Invalid role");
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          router.push("/login");
        }
      } else {
        // User is not signed in, redirect to login
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const openIDE = () => {
    router.push("/dashboard/student/ide");
  };

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
            <Button onClick={()=> router.push ("/dashboard/student/messageStudent")}>Join Team Chat</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Direct Messaging</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/student/message")}>Message Instructor</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}