"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import HighSchoolSearch from "@/components/HighSchoolSearch";
import { IoIosNotifications } from "react-icons/io";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "" });
  const [selectedSchool, setSelectedSchool] = useState({ school_name: "", school_id: "" });
  const [verifiedUserCount, setVerifiedUserCount] = useState(0);
  const [verifiedUserNotifications, setVerifiedUserNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [acknowledgedVerifiedUsers, setAcknowledgedVerifiedUsers] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSchoolSelect = (name: string, placeId: any) => {
    setSelectedSchool({ school_name: name, school_id: placeId });
    console.log("Selected School:", name, "Place ID:", placeId);
  };

  // Lock navigation
  useEffect(() => {
    const preventNavigation = (e: PopStateEvent) => {
      console.log("Navigation attempt blocked in AdminDashboard");
      e.preventDefault();
      window.history.pushState(null, "", window.location.pathname);
    };
    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", preventNavigation);
    return () => window.removeEventListener("popstate", preventNavigation);
  }, []);

  // Auth state listener for admin only
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged triggered, user:", user?.uid, "current admin userId:", userId);
      if (user) {
        const uid = user.uid;
        if (!userId) setUserId(uid); // Set initial admin UID
        const token = await user.getIdToken();

        // Only proceed if this is the admin’s session
        if (userId && uid !== userId) {
          console.log("Ignoring auth change for new user, admin UID:", userId);
          return; // Skip if this isn’t the admin’s UID
        }

        try {
          const loginResponse = await fetch("http://127.0.0.1:8080/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });
          if (!loginResponse.ok) console.error("Login logging failed:", await loginResponse.text());
          else console.log("Login logged successfully");
        } catch (error) {
          console.error("Error notifying backend of login:", error);
        }

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
          const userRef = doc(db, "users", uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setAcknowledgedVerifiedUsers(userDoc.data().acknowledgedVerifiedUsers || []);
          }
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, userId]);

  // Fetch verified users
  useEffect(() => {
    if (!userRole || userRole !== "admin" || !userId) return;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("verified", "==", true));

    const unsubscribeQuery = onSnapshot(q, (snapshot) => {
      const verifiedUsers: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;
        if (!acknowledgedVerifiedUsers.includes(id) && !verifiedUsers.some((u) => u.id === id)) {
          verifiedUsers.push({ id, email: data.email, name: data.name, role: data.role });
        }
      });
      setVerifiedUserCount(verifiedUsers.length);
      setVerifiedUserNotifications(verifiedUsers);
    }, (error) => console.error("Error fetching verified users:", error));

    return () => unsubscribeQuery();
  }, [userRole, userId, acknowledgedVerifiedUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Step 1: Form submission prevented");

    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role || !selectedSchool.school_name) {
      setNotification("Please fill out all required fields");
      console.log("Step 2: Validation failed");
      return;
    }

    try {
      console.log("Step 3: Creating Firebase user");
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const user = userCredential.user;
      console.log("Step 4: Firebase user created, UID:", user.uid);

      console.log("Step 5: Sending verification email");
      await sendEmailVerification(user);
      console.log("Step 6: Verification email sent");

      console.log("Step 7: Registering with backend");
      const response = await fetch("http://localhost:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uid,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          school_name: selectedSchool.school_name,
          school_id: selectedSchool.school_id,
        }),
      });
      console.log("Step 8: Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend registration failed: ${errorText}`);
      }

      const data = await response.json();
      console.log("Step 9: User registered successfully:", data);

      setNotification("Account created successfully. A verification email has been sent to the user.");
      setIsCreateUserDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "" });
      setSelectedSchool({ school_name: "", school_id: "" });
      console.log("Step 10: Form reset, dialog closed");

    } catch (error: any) {
      console.error("Error creating user:", error.message);
      let errorMessage = "Error: Please try again.";
      if (error.code === "auth/email-already-in-use") errorMessage = "Error: This email is already in use.";
      else if (error.code === "auth/invalid-email") errorMessage = "Error: Invalid email format.";
      else if (error.code === "auth/weak-password") errorMessage = "Error: Password must be at least 6 characters.";
      else errorMessage = `Error: ${error.message}`;
      setNotification(errorMessage);
      console.log("Step 11: Error handled");
    }
  };

  const handleBellClick = () => setShowNotifications((prev) => !prev);
  const handleMarkAsRead = async (notification: any) => {
    const updatedList = [...acknowledgedVerifiedUsers, notification.id];
    setAcknowledgedVerifiedUsers(updatedList);
    if (userId) {
      const userRef = doc(db, "users", userId);
      try {
        await updateDoc(userRef, { acknowledgedVerifiedUsers: updatedList });
      } catch (error) {
        console.error("Error updating Firestore:", error);
        setAcknowledgedVerifiedUsers(acknowledgedVerifiedUsers);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const allVerifiedUserIds = verifiedUserNotifications.map((n) => n.id);
    const updatedList = [...acknowledgedVerifiedUsers, ...allVerifiedUserIds];
    setAcknowledgedVerifiedUsers(updatedList);
    if (userId) {
      const userRef = doc(db, "users", userId);
      try {
        await updateDoc(userRef, { acknowledgedVerifiedUsers: updatedList });
      } catch (error) {
        console.error("Error updating Firestore:", error);
        setAcknowledgedVerifiedUsers(acknowledgedVerifiedUsers);
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <DashboardLayout userType="admin">
      <div className="relative">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        {notification && (
          <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded flex justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-blue-600 underline">
              Dismiss
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader><CardTitle>Account Management</CardTitle></CardHeader>
            <CardContent>
              <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                <DialogTrigger asChild><Button>Create New Account</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateUser}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="school" className="text-right">School</Label>
                        <HighSchoolSearch onSelect={handleSchoolSelect} Style={"Management"} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a role" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">student</SelectItem>
                            <SelectItem value="instructor">instructor</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter><Button type="submit">Create User</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          {/* Other Cards */}
          <Card><CardHeader><CardTitle>Activity Monitoring</CardTitle></CardHeader><CardContent><Button onClick={() => router.push("/dashboard/admin/logs")}>View Activity Logs</Button></CardContent></Card>
          <Card><CardHeader><CardTitle>Resource Management</CardTitle></CardHeader><CardContent><Button onClick={() => router.push("/dashboard/admin/resource-manager")}>Upload Training Materials</Button></CardContent></Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList><TabsTrigger value="users">User List</TabsTrigger><TabsTrigger value="chats">Chat List</TabsTrigger></TabsList>
          <TabsContent value="users"><Card><CardHeader><CardTitle>User List</CardTitle></CardHeader><CardContent><UserList /></CardContent></Card></TabsContent>
          <TabsContent value="chats"><Card><CardHeader><CardTitle>Chat List</CardTitle></CardHeader><CardContent><ChatList /></CardContent></Card></TabsContent>
        </Tabs>

        <div onClick={handleBellClick} className="fixed top-4 right-16 bg-blue-500 text-white rounded-full cursor-pointer shadow-lg flex items-center justify-center w-10 h-10">
          <IoIosNotifications size={20} />
          {verifiedUserCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{verifiedUserCount}</span>
          )}
        </div>

        {showNotifications && (
          <div className="fixed top-14 right-16 bg-white shadow-lg rounded-md p-4 w-72 z-10">
            <h3 className="font-bold text-lg">Verified User Notifications</h3>
            {verifiedUserNotifications.length > 0 ? (
              <>
                <ul className="mt-2 space-y-2">
                  {verifiedUserNotifications.map((notification) => (
                    <li key={notification.id} className="p-2 bg-gray-100 rounded">
                      <p className="text-sm text-black">New user verified: {notification.email}</p>
                      <p className="text-xs text-gray-500">Name: {notification.name} ({notification.role})</p>
                      <button onClick={() => handleMarkAsRead(notification)} className="mt-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded px-2 py-1">Mark as Read</button>
                    </li>
                  ))}
                </ul>
                <button onClick={handleMarkAllAsRead} className="mt-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded px-2 py-1">Mark All as Read</button>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No new verified users</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}