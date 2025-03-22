'use client';

import React, { useEffect } from "react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebaseConfig"; // Import Firestore
import { collection, onSnapshot } from "firebase/firestore"; // Import Firestore methods

export function UserList() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState<(typeof users)[0] | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // State for Save Changes animation
  const [isDeleting, setIsDeleting] = useState(false); // State for Delete animation

  // Fetch and listen to user data in real-time, sorted alphabetically by name
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const userData = snapshot.docs.map((doc) => ({
        user_id: doc.id,
        ...doc.data(),
      })).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
      setUsers(userData);
      console.log("Users updated in real-time (sorted alphabetically):", userData);
    }, (error) => {
      console.error("Error listening to users:", error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleEdit = (user: (typeof users)[0]) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setIsSaving(true); // Start animation
      try {
        const response = await fetch("http://localhost:8080/edit-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: editingUser.user_id,
            email: editingUser.email,
            name: editingUser.name,
            role: editingUser.role,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update user");
        }

        setIsEditDialogOpen(false);
        // No need to manually update state here; Firestore listener will handle it
      } catch (error) {
        console.error("Error updating user:", error);
      } finally {
        setTimeout(() => setIsSaving(false), 1000); // Reset animation after 1s
      }
    }
  };

  const handleDelete = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      setIsDeleting(true); // Start animation
      try {
        const response = await fetch("http://localhost:8080/delete-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userToDelete }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete user");
        }

        setIsDeleteDialogOpen(false);
        // No need to manually update state here; Firestore listener will handle it
      } catch (error) {
        console.error("Error deleting user:", error);
      } finally {
        setTimeout(() => setIsDeleting(false), 1000); // Reset animation after 1s
      }
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(user.user_id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingUser?.name || ""}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingUser?.email || ""}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={editingUser?.role || ""}
                  onValueChange={(value) => setEditingUser((prev) => (prev ? { ...prev, role: value } : null))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="relative flex items-center justify-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="mr-2">Saving</span>
                    <span className="spinner" />
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this user? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="relative flex items-center justify-center"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">Deleting</span>
                  <span className="spinner" />
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom CSS for animation */}
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
    </>
  );
}