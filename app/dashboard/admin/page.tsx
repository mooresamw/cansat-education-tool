'use client'

import { DashboardLayout} from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserList } from "@/components/UserList"
import { ChatList } from "@/components/ChatList"
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {auth} from "@/lib/firebaseConfig"
import type { File } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [UserRole, setUserRole] = useState();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "" })
  const [isUploadPdfDialogOpen, setIsUploadPdfDialogOpen] = useState(false)
  const [pdfUpload, setPdfUpload] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState("");

  // Function to send a new user to the backend
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newUser) {
        try {
            const response = await fetch("http://localhost:8080/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password, // Ensure password is included in the form state
                    name: newUser.name,
                    role: newUser.role,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create user");
            }

            const data = await response.json();
            console.log("User created successfully:", data);

            // Update frontend state to reflect new user
            // setUsers([...users, { ...newUser, user_id: data.user_id }]);
            setIsCreateUserDialogOpen(false);
            setNewUser({ name: "", email: "", password: "", role: "" }); // Reset form

        } catch (error) {
            console.error("Error creating user:", error);
        }
    }
  }

  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdfUpload) {
      setUploadMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfUpload); // Send file as "file" key

    try {
      const response = await fetch("http://localhost:8080/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setUploadMessage(`File uploaded successfully! View: ${data.url}`);
      } else {
        setUploadMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setUploadMessage(`Error uploading file: ${error}`);
    }
    console.log("Uploading PDF:", pdfUpload)
    setIsUploadPdfDialogOpen(false)
    setPdfUpload(null)
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get the token
        const token = await user.getIdToken();

        const response = await fetch("http://127.0.0.1:8080/check-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });
        const data = await response.json();
        if (data.role !== "admin") {
          router.push(`/dashboard/${data.role}`);
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

  if(loading) return (<p>Loading...</p>); //Show a loading screen until redirect happens

  return (
    <DashboardLayout userType="admin">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create New Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a role"/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Instructor">Instructor</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create User</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
            <Dialog open={isUploadPdfDialogOpen} onOpenChange={setIsUploadPdfDialogOpen}>
              <DialogTrigger asChild>
                <Button>Upload Training Materials</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload PDF</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePdfUpload}>
                  <div className="grid gap-4 py-4">
                    <p>{uploadMessage}</p>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pdf-file" className="text-right">
                        PDF File
                      </Label>
                      <div className="col-span-3">
                        <Input
                            id="pdf-file"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setPdfUpload(e.target.files ? e.target.files[0] : null)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Upload PDF</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">User List</TabsTrigger>
          <TabsTrigger value="chats">Chat List</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
            </CardHeader>
            <CardContent>
              <UserList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chats">
          <Card>
            <CardHeader>
              <CardTitle>Chat List</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}