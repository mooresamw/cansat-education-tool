"use client"

import React, {useEffect} from "react"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "@/lib/firebaseConfig";

const initialUsers = [
  { user_id: 1, name: "John Doe", email: "john@example.com", role: "Student" },
  { user_id: 2, name: "Jane Smith", email: "jane@example.com", role: "Instructor" },
  { user_id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Student" },
]

export function UserList() {
  const [users, setUsers] = useState(initialUsers)
  const [editingUser, setEditingUser] = useState<(typeof users)[0] | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)


  // Fetch user data on page load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8080/users", {});
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    }

    fetchUsers();
  }, []);

  const handleEdit = (user: (typeof users)[0]) => {
    setEditingUser(user)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
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

        // Update state after successful edit
        setUsers(users.map((user) => user.user_id === editingUser.user_id ? editingUser : user));

        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  }

  const handleDelete = (userId: number) => {
    setUserToDelete(userId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (userToDelete) {
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

            // Update state after successful deletion
            setUsers(users.filter((user) => user.user_id !== userToDelete));
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    }
  }

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
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Instructor">Instructor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
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
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}