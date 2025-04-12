"use client"

import type React from "react"
import { useEffect } from "react"
import { useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { FileText, Trash2, Upload, Code, Pencil } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, getDoc, collection, setDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Editor from "@monaco-editor/react"

// Update these utility functions at the top of the file, after the imports
const escapeToNewlines = (str: string) => (str ? str.replace(/\\n/g, "\n") : "")
const newlinesToEscape = (str: string) => (str ? str.replace(/\n/g, "\\n") : "")

export default function AdminPdfManager() {
  const router = useRouter()
  const [pdfs, setPdfs] = useState([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pdfToDelete, setPdfToDelete] = useState<string | null>(null)
  const [pdfUpload, setPdfUpload] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState("")
  const [newPdf, setNewPdf] = useState({
    file: null as File | null,
  })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [acknowledgedVerifiedUsers, setAcknowledgedVerifiedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pdf")
  const [isAddProblemDialogOpen, setIsAddProblemDialogOpen] = useState(false)
  const [isEditProblemDialogOpen, setIsEditProblemDialogOpen] = useState(false)
  const [codingProblems, setCodingProblems] = useState([])
  const [newProblem, setNewProblem] = useState({
    id: "",
    title: "",
    description: "",
    difficulty: "Easy",
    initialCode: escapeToNewlines(
      "void setup() {\n  Serial.begin(9600);\n  // Your code here\n}\n\nvoid loop() {\n  // No need to use loop() for this problem\n}",
    ),
    hint: "",
    explanation: "",
    expectedOutput: "",
  })
  const [editingProblem, setEditingProblem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // Auth state listener for admin only
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged triggered, user:", user?.uid, "current admin userId:", userId)
      if (user) {
        const uid = user.uid
        if (!userId) setUserId(uid)
        const token = await user.getIdToken()

        const response = await fetch("http://127.0.0.1:8080/check-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        })
        const data = await response.json()

        if (data.role !== "admin" && uid === userId) {
          router.push(`/dashboard/${data.role}`)
        } else if (data.role === "admin") {
          setUserRole(data.role)
          const userRef = doc(db, "users", uid)
          const userDoc = await getDoc(userRef)
          if (userDoc.exists()) {
            setAcknowledgedVerifiedUsers(userDoc.data().acknowledgedVerifiedUsers || [])
          }
        }
      } else if (!user && userId) {
        router.push("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, userId])

  // Fetch pdf data on page load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8080/get-pdfs", {})
        const data = await response.json()
        setPdfs(data)
      } catch (error) {
        console.log("Error fetching data:", error)
      }
    }

    fetchUsers()
  }, [])

  // Fetch coding problems on page load
  useEffect(() => {
    const fetchCodingProblems = async () => {
      try {
        const problemsCollection = collection(db, "codingProblems")
        const problemsSnapshot = await getDoc(doc(problemsCollection, "arduino"))
        if (problemsSnapshot.exists()) {
          const problemsData = problemsSnapshot.data().problems || []
          // Don't convert the data in the state as it needs to be in the original format
          setCodingProblems(problemsData)
        }
      } catch (error) {
        console.log("Error fetching coding problems:", error)
      }
    }

    fetchCodingProblems()
  }, [])

  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdfUpload) {
      setUploadMessage("Please select a file first.")
      return
    }

    const formData = new FormData()
    formData.append("file", pdfUpload) // Send file as "file" key
    formData.append("userId", userId)

    try {
      const response = await fetch("http://localhost:8080/upload-pdf", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("PDF uploaded", {
          description: `${pdfUpload.name} has been successfully uploaded.`,
        })
      } else {
        setUploadMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setUploadMessage(`Error uploading file: ${error}`)
    }

    const currentDate = new Date().toUTCString()
    const fileSize = pdfUpload ? `${(pdfUpload.size / (1024 * 1024)).toFixed(2)}` : "0 MB"
    const newPdfEntry = {
      id: (pdfs.length + 1).toString(),
      name: pdfUpload.name,
      last_modified: currentDate,
      size_mb: fileSize,
    }
    setPdfs([...pdfs, newPdfEntry])
    setIsUploadDialogOpen(false)
    setPdfUpload(null)
  }

  const handleDeletePdf = (id: string) => {
    setPdfToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (pdfToDelete) {
      try {
        const pdf = pdfs.find((p) => p.id === pdfToDelete)
        if (!pdf) return

        // Get the current user's ID token
        const idToken = await auth.currentUser?.getIdToken()

        const response = await fetch("http://localhost:8080/delete-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ file_name: pdf.name, idToken }), // Include idToken
        })

        if (!response.ok) {
          throw new Error("Failed to delete PDF")
        }

        setPdfs(pdfs.filter((pdf) => pdf.id !== pdfToDelete))
        setIsDeleteDialogOpen(false)
        setPdfToDelete(null)
        toast.success("PDF Deleted", {
          description: `${pdf.name} has been successfully deleted.`,
        })
      } catch (error) {
        console.error("Error deleting PDF:", error)
      }
    }
  }

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate required fields
      if (!newProblem.id || !newProblem.title || !newProblem.description) {
        toast.error("Missing required fields", {
          description: "ID, title, and description are required.",
        })
        return
      }

      // Check if ID already exists
      const existingProblem = codingProblems.find((p) => p.id === newProblem.id)
      if (existingProblem) {
        toast.error("Problem ID already exists", {
          description: "Please use a unique ID for the problem.",
        })
        return
      }

      // Prepare problem data with escaped newlines
      const problemData = {
        ...newProblem,
        initialCode: newlinesToEscape(newProblem.initialCode),
      }

      // Add the new problem to Firestore
      const problemsRef = doc(db, "codingProblems", "arduino")
      const problemsDoc = await getDoc(problemsRef)

      if (problemsDoc.exists()) {
        // Update existing document
        const updatedProblems = [...(problemsDoc.data().problems || []), problemData]
        await setDoc(problemsRef, { problems: updatedProblems })
      } else {
        // Create new document
        await setDoc(problemsRef, { problems: [problemData] })
      }

      // Update local state
      setCodingProblems([...codingProblems, problemData])

      // Reset form and close dialog
      setNewProblem({
        id: "",
        title: "",
        description: "",
        difficulty: "Easy",
        initialCode: escapeToNewlines(
          "void setup() {\n  Serial.begin(9600);\n  // Your code here\n}\n\nvoid loop() {\n  // No need to use loop() for this problem\n}",
        ),
        hint: "",
        explanation: "",
        expectedOutput: "",
      })

      setIsAddProblemDialogOpen(false)

      toast.success("Problem Added", {
        description: `${newProblem.title} has been successfully added.`,
      })
    } catch (error) {
      console.error("Error adding problem:", error)
      toast.error("Failed to add problem", {
        description: "An error occurred while adding the problem.",
      })
    }
  }

  const handleEditProblem = (problem) => {
    // Convert escaped newlines to actual newlines for editing
    setEditingProblem({
      ...problem,
      initialCode: escapeToNewlines(problem.initialCode),
    })
    setIsEditing(true)
    setIsEditProblemDialogOpen(true)
  }

  const handleUpdateProblem = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate required fields
      if (!editingProblem.title || !editingProblem.description) {
        toast.error("Missing required fields", {
          description: "Title and description are required.",
        })
        return
      }

      // Prepare problem data with escaped newlines
      const updatedProblem = {
        ...editingProblem,
        initialCode: newlinesToEscape(editingProblem.initialCode),
      }

      // Update the problem in Firestore
      const problemsRef = doc(db, "codingProblems", "arduino")
      const problemsDoc = await getDoc(problemsRef)

      if (problemsDoc.exists()) {
        const currentProblems = problemsDoc.data().problems || []
        const updatedProblems = currentProblems.map((p) => (p.id === updatedProblem.id ? updatedProblem : p))

        // Update Firestore
        await setDoc(problemsRef, { problems: updatedProblems })

        // Update local state
        setCodingProblems(updatedProblems)

        setIsEditProblemDialogOpen(false)
        setEditingProblem(null)
        setIsEditing(false)

        toast.success("Problem Updated", {
          description: `${updatedProblem.title} has been successfully updated.`,
        })
      }
    } catch (error) {
      console.error("Error updating problem:", error)
      toast.error("Failed to update problem", {
        description: "An error occurred while updating the problem.",
      })
    }
  }

  const handleDeleteProblem = async (id: string) => {
    try {
      // Get the current problems
      const problemsRef = doc(db, "codingProblems", "arduino")
      const problemsDoc = await getDoc(problemsRef)

      if (problemsDoc.exists()) {
        const currentProblems = problemsDoc.data().problems || []
        const updatedProblems = currentProblems.filter((p) => p.id !== id)

        // Update Firestore
        await setDoc(problemsRef, { problems: updatedProblems })

        // Update local state
        setCodingProblems(updatedProblems)

        toast.success("Problem Deleted", {
          description: `Problem has been successfully deleted.`,
        })
      }
    } catch (error) {
      console.error("Error deleting problem:", error)
      toast.error("Failed to delete problem", {
        description: "An error occurred while deleting the problem.",
      })
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resource Management</h1>
      </div>

      <Tabs defaultValue="pdf" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex w-full mb-6">
          <TabsTrigger value="pdf">PDF Resources</TabsTrigger>
          <TabsTrigger value="coding">Coding Problems</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload New PDF
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>PDF Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pdfs.map((pdf) => (
                    <TableRow key={pdf.id}>
                      <TableCell className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-gray-500" />
                        {pdf.name}
                      </TableCell>
                      <TableCell>{pdf.last_modified}</TableCell>
                      <TableCell>{pdf.size_mb}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePdf(pdf.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coding">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsAddProblemDialogOpen(true)}>
              <Code className="mr-2 h-4 w-4" />
              Add New Problem
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coding Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codingProblems.map((problem) => (
                    <TableRow key={problem.id}>
                      <TableCell>{problem.id}</TableCell>
                      <TableCell>{problem.title}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            problem.difficulty === "Easy"
                              ? "bg-green-100 text-green-800"
                              : problem.difficulty === "Medium"
                                ? "bg-yellow-500 text-amber-900"
                                : "bg-red-500 text-white"
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProblem(problem)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProblem(problem.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload PDF Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New PDF</DialogTitle>
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

      {/* Add Coding Problem Dialog */}
      <Dialog open={isAddProblemDialogOpen} onOpenChange={setIsAddProblemDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Coding Problem</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProblem}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="problem-id">Problem ID</Label>
                  <Input
                    id="problem-id"
                    placeholder="arduino-id#"
                    value={newProblem.id}
                    onChange={(e) => setNewProblem({ ...newProblem, id: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="problem-difficulty">Difficulty</Label>
                  <Select
                    value={newProblem.difficulty}
                    onValueChange={(value) => setNewProblem({ ...newProblem, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="problem-title">Title</Label>
                <Input
                  id="problem-title"
                  placeholder="Problem title"
                  value={newProblem.title}
                  onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="problem-description">Description</Label>
                <Textarea
                  id="problem-description"
                  placeholder="Problem description"
                  value={newProblem.description}
                  onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="problem-initial-code">Initial Code</Label>
                <Editor
                  height="200px"
                  defaultLanguage="cpp"
                  value={newProblem.initialCode}
                  onChange={(value) => setNewProblem({ ...newProblem, initialCode: value || "" })}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="problem-hint">Hint</Label>
                <Textarea
                  id="problem-hint"
                  placeholder="Hint for solving the problem"
                  value={newProblem.hint}
                  onChange={(e) => setNewProblem({ ...newProblem, hint: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="problem-explanation">Explanation</Label>
                <Textarea
                  id="problem-explanation"
                  placeholder="Explanation of the solution"
                  value={newProblem.explanation}
                  onChange={(e) => setNewProblem({ ...newProblem, explanation: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="problem-expected-output">Expected Output</Label>
                <Textarea
                  id="problem-expected-output"
                  placeholder="Expected output of the solution"
                  value={newProblem.expectedOutput}
                  onChange={(e) => setNewProblem({ ...newProblem, expectedOutput: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Problem</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Coding Problem Dialog */}
      <Dialog open={isEditProblemDialogOpen} onOpenChange={setIsEditProblemDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coding Problem</DialogTitle>
          </DialogHeader>
          {editingProblem && (
            <form onSubmit={handleUpdateProblem}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-problem-id">Problem ID</Label>
                    <Input id="edit-problem-id" value={editingProblem.id} disabled className="bg-gray-100" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-problem-difficulty">Difficulty</Label>
                    <Select
                      value={editingProblem.difficulty}
                      onValueChange={(value) => setEditingProblem({ ...editingProblem, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-problem-title">Title</Label>
                  <Input
                    id="edit-problem-title"
                    placeholder="Problem title"
                    value={editingProblem.title}
                    onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-problem-description">Description</Label>
                  <Textarea
                    id="edit-problem-description"
                    placeholder="Problem description"
                    value={editingProblem.description}
                    onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-problem-initial-code">Initial Code</Label>
                  <Editor
                    height="200px"
                    defaultLanguage="cpp"
                    value={editingProblem.initialCode}
                    onChange={(value) => setEditingProblem({ ...editingProblem, initialCode: value || "" })}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-problem-hint">Hint</Label>
                  <Textarea
                    id="edit-problem-hint"
                    placeholder="Hint for solving the problem"
                    value={editingProblem.hint}
                    onChange={(e) => setEditingProblem({ ...editingProblem, hint: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-problem-explanation">Explanation</Label>
                  <Textarea
                    id="edit-problem-explanation"
                    placeholder="Explanation of the solution"
                    value={editingProblem.explanation}
                    onChange={(e) => setEditingProblem({ ...editingProblem, explanation: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-problem-expected-output">Expected Output</Label>
                  <Textarea
                    id="edit-problem-expected-output"
                    placeholder="Expected output of the solution"
                    value={editingProblem.expectedOutput}
                    onChange={(e) => setEditingProblem({ ...editingProblem, expectedOutput: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Problem</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the PDF resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}