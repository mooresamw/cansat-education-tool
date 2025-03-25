"use client";

<<<<<<< HEAD
=======
import { useEffect, useState } from "react";
>>>>>>> d3e1e7af10e838d0b646de936614e59505161d7b
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
<<<<<<< HEAD
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserList } from "@/components/UserList";
import { ChatList } from "@/components/ChatList";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import type { File } from "lucide-react";
=======
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserList } from "@/components/UserList";
import { ChatList } from "@/components/ChatList";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
>>>>>>> d3e1e7af10e838d0b646de936614e59505161d7b
import HighSchoolSearch from "@/components/HighSchoolSearch";
import { IoIosNotifications } from "react-icons/io";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [userRole, setUserRole] = useState<string | undefined>(undefined); // Fixed UserRole capitalization for consistency
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "" });
  const [isUploadPdfDialogOpen, setIsUploadPdfDialogOpen] = useState(false);
=======
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "" });
>>>>>>> d3e1e7af10e838d0b646de936614e59505161d7b
  const [selectedSchool, setSelectedSchool] = useState({
    school_name: "",
    school_id: "",
  });
<<<<<<< HEAD
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // Added state for activeTab
=======
  const [verifiedUserCount, setVerifiedUserCount] = useState(0);
  const [verifiedUserNotifications, setVerifiedUserNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [acknowledgedVerifiedUsers, setAcknowledgedVerifiedUsers] = useState<string[]>([]);
>>>>>>> d3e1e7af10e838d0b646de936614e59505161d7b

  const handleSchoolSelect = (name: string, placeId: any) => {
    setSelectedSchool({
      school_name: name,
      school_id: placeId,
    });
    console.log("Selected School:", name, "Place ID:", placeId);
  };
<<<<<<< HEAD

  // Function to send a new user to the backend
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser) {
      try {
        setIsCreating(true); // Set creating state to true when starting
        const response = await fetch("http://localhost:8080/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password,
            name: newUser.name,
            role: newUser.role,
            school_name: selectedSchool.school_name,
            school_id: selectedSchool.school_id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create user");
        }

        const data = await response.json();
        console.log("User created successfully:", data);
        setIsCreateUserDialogOpen(false);
        setNewUser({ name: "", email: "", password: "", role: "" });
      } catch (error) {
        console.error("Error creating user:", error);
      } finally {
        setTimeout(() => setIsCreating(false), 1000);
      }
    }
  };
=======
>>>>>>> d3e1e7af10e838d0b646de936614e59505161d7b

  // Fetch authenticated user and role, and load acknowledgedVerifiedUsers from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
<<<<<<< HEAD
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

          const roleResponse = await fetch("http://127.0.0.1:8080/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });

          const roleData = await roleResponse.json();
          if (roleData.role !== "admin") {
            router.push(`/dashboard/${roleData.role}`);
          } else {
            setUserRole(roleData.role);
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          router.push("/login");
=======
        const uid = user.uid;
        setUserId(uid);
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

          // Fetch acknowledgedVerifiedUsers from Firestore
          const userRef = doc(db, "users", uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const acknowledged = userData.acknowledgedVerifiedUsers || [];
            console.log("Loaded acknowledgedVerifiedUsers from Firestore:", acknowledged);
            setAcknowledgedVerifiedUsers(acknowledged);
          } else {
            console.log("Admin user document not found");
          }
>>>>>>> d3e1e7af10e838d0b646de936614e59505161d7b
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

<<<<<<< HEAD
  if (loading) return (<p>Loading...</p>);

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
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        School
                      </Label>
                      <HighSchoolSearch onSelect={handleSchoolSelect} Style={'Management'}></HighSchoolSearch>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a role" />
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
                    <Button
                      type="submit"
                      className="relative flex items-center justify-center"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <span className="mr-2">Creating</span>
                          <span className="spinner" />
                        </>
                      ) : (
                        "Create User"
                      )}
                    </Button>
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
            <Button onClick={() => router.push("/dashboard/admin/logs")}>
              View Activity Logs
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resource Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/admin/resource-manager")}>Upload Training Materials</Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

      <style jsx>{`
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 8px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
=======
  // Fetch verified users from the users collection
  useEffect(() => {
    if (!userRole || userRole !== "admin") {
      console.log("User role is not admin or not authenticated:", userRole);
      return;
    }

    if (!userId) {
      console.log("No userId available yet");
      return;
    }

    // Query the users collection for users with verified: true
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("verified", "==", true));

    const unsubscribeQuery = onSnapshot(q, (snapshot) => {
      const verifiedUsers: any[] = [];

      console.log("Verified Users Snapshot size:", snapshot.size);
      if (snapshot.empty) {
        console.log("No verified users found");
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        const userId = doc.id;
        console.log("Processing user ID:", userId, "User Data:", data);

        // Check if the user has already been acknowledged
        console.log("Checking if user is acknowledged:", userId, "Acknowledged List:", acknowledgedVerifiedUsers);
        if (!acknowledgedVerifiedUsers.includes(userId)) {
          // Check if the user is already in verifiedUsers to avoid duplicates
          if (!verifiedUsers.some((user) => user.id === userId)) {
            verifiedUsers.push({
              id: userId,
              email: data.email,
              name: data.name,
              role: data.role,
            });
            console.log("Added user to verifiedUsers:", userId);
          } else {
            console.log("User already in verifiedUsers, skipping:", userId);
          }
        } else {
          console.log("User already acknowledged, skipping:", userId);
        }
      });

      console.log("Verified User Notification Count:", verifiedUsers.length);
      console.log("Verified User Notifications:", verifiedUsers);

      setVerifiedUserCount(verifiedUsers.length);
      setVerifiedUserNotifications(verifiedUsers);
    }, (error) => {
      console.error("Error in onSnapshot Query for verified users:", error);
    });

    return () => unsubscribeQuery();
  }, [userRole, userId, acknowledgedVerifiedUsers]);

  // Function to send a new user to the backend
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newUser) {
      try {
        const response = await fetch("http://localhost:8080/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password,
            name: newUser.name,
            role: newUser.role,
            school_name: selectedSchool.school_name,
            school_id: selectedSchool.school_id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create user");
        }

        const data = await response.json();
        console.log("User created successfully:", data);

        setIsCreateUserDialogOpen(false);
        setNewUser({ name: "", email: "", password: "", role: "" });
        setSelectedSchool({ school_name: "", school_id: "" });
      } catch (error) {
        console.error("Error creating user:", error);
      }
    }
  };

  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleMarkAsRead = async (notification: any) => {
    console.log("Marking verified user as acknowledged:", notification);
    const updatedList = [...acknowledgedVerifiedUsers, notification.id];
    setAcknowledgedVerifiedUsers(updatedList);
    console.log("Updated acknowledgedVerifiedUsers:", updatedList);

    // Update Firestore with the new acknowledgedVerifiedUsers list
    if (userId) {
      const userRef = doc(db, "users", userId);
      try {
        await updateDoc(userRef, {
          acknowledgedVerifiedUsers: updatedList,
        });
        console.log("Saved acknowledgedVerifiedUsers to Firestore:", updatedList);
      } catch (error) {
        console.error("Error saving acknowledgedVerifiedUsers to Firestore:", error);
        // Revert the state if the Firestore update fails
        setAcknowledgedVerifiedUsers(acknowledgedVerifiedUsers);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const allVerifiedUserIds = verifiedUserNotifications.map((notification) => notification.id);
    const updatedList = [...acknowledgedVerifiedUsers, ...allVerifiedUserIds];
    setAcknowledgedVerifiedUsers(updatedList);

    if (userId) {
      const userRef = doc(db, "users", userId);
      try {
        await updateDoc(userRef, {
          acknowledgedVerifiedUsers: updatedList,
        });
        console.log("Saved all acknowledgedVerifiedUsers to Firestore:", updatedList);
      } catch (error) {
        console.error("Error saving acknowledgedVerifiedUsers to Firestore:", error);
        setAcknowledgedVerifiedUsers(acknowledgedVerifiedUsers);
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <DashboardLayout userType="admin">
      <div className="relative">
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
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="school" className="text-right">
                          School
                        </Label>
                        <HighSchoolSearch onSelect={handleSchoolSelect} Style={"Management"} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Role
                        </Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a role" />
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
              <Button onClick={() => router.push("/dashboard/admin/resource-manager")}>
                Upload Training Materials
              </Button>
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

        {/* Bell Icon for Verified User Notifications */}
        <div
          onClick={handleBellClick}
          className="fixed top-4 right-16 bg-blue-500 text-white rounded-full cursor-pointer shadow-lg flex items-center justify-center w-10 h-10"
        >
          <IoIosNotifications size={20} />
          {verifiedUserCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {verifiedUserCount}
            </span>
          )}
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="fixed top-14 right-16 bg-white shadow-lg rounded-md p-4 w-72 z-10">
            <h3 className="font-bold text-lg">Verified User Notifications</h3>
            {verifiedUserNotifications.length > 0 ? (
              <>
                <ul className="mt-2 space-y-2">
                  {verifiedUserNotifications.map((notification, index) => (
                    <li key={notification.id} className="p-2 bg-gray-100 rounded">
                      <p className="text-sm text-black">
                        New user verified: {notification.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Name: {notification.name} ({notification.role})
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
                <button
                  onClick={handleMarkAllAsRead}
                  className="mt-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded px-2 py-1"
                >
                  Mark All as Read
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No new verified users</p>
            )}
          </div>
        )}
      </div>
>>>>>>> d3e1e7af10e838d0b646de936614e59505161d7b
    </DashboardLayout>
  );
}