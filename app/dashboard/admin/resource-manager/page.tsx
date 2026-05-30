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
import { Progress } from "@/components/ui/progress"
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
import { v4 as uuidv4 } from "uuid"
import { FileText, Trash2, Upload, Code, Pencil, ClipboardList, Plus, X } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "@/lib/firebaseConfig"
import { apiUrlBase } from "@/lib/configEnv"
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from "firebase/firestore"
import { QUIZ_COLLECTION, formatPdfName, type QuizQuestion } from "@/lib/quizzes"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Editor from "@monaco-editor/react"

// Update these utility functions at the top of the file, after the imports
const escapeToNewlines = (str: string) => (str ? str.replace(/\\n/g, "\n") : "")
const newlinesToEscape = (str: string) => (str ? str.replace(/\n/g, "\\n") : "")

// Custom dialog content styles
const customDialogStyles = {
  width: "900px",
  height: "600px",
  maxWidth: "900px",
  maxHeight: "600px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  top: "50%",
  left: "50%"
}

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
  // Code resources state
  const [codeResources, setCodeResources] = useState([])
  const [codeUpload, setCodeUpload] = useState<File | null>(null)
  const [isCodeUploadDialogOpen, setIsCodeUploadDialogOpen] = useState(false)
  const [codeUploadMessage, setCodeUploadMessage] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadingCode, setIsUploadingCode] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState<any>(null)
  const [isCodeDeleteDialogOpen, setIsCodeDeleteDialogOpen] = useState(false)
  // Quiz state
  const [quizzes, setQuizzes] = useState<{ title: string; questions: QuizQuestion[] }[]>([])
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [isEditingQuiz, setIsEditingQuiz] = useState(false)
  const [quizForm, setQuizForm] = useState<{ title: string; questions: QuizQuestion[] }>({
    title: "",
    questions: [],
  })
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null)
  const [isQuizDeleteDialogOpen, setIsQuizDeleteDialogOpen] = useState(false)

  // Auth state listener for admin only
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged triggered, user:", user?.uid, "current admin userId:", userId)
      if (user) {
        const uid = user.uid
        if (!userId) setUserId(uid)
        const token = await user.getIdToken()

        const response = await fetch(`${apiUrlBase}/check-role`, {
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
        const response = await fetch(`${apiUrlBase}/get-pdfs`, {})
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
          // Difficulty order mapping
          const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };

          // Sort by difficulty
          problemsData.sort((a: any, b: any) => {
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          });

          console.log(problemsData);
          setCodingProblems(problemsData);
        }
      } catch (error) {
        console.log("Error fetching coding problems:", error)
      }
    }

    fetchCodingProblems()
  }, [])

  // Fetch code resources from Firebase Storage
  const fetchCodeResources = async () => {
    try {
      const response = await fetch(`${apiUrlBase}/get-code`)
      const data = await response.json()
      setCodeResources(data)
    } catch (error) {
      console.log("Error fetching code resources:", error)
    }
  }

  useEffect(() => {
    fetchCodeResources()
  }, [])

  // Fetch quizzes from Firestore
  const fetchQuizzes = async () => {
    try {
      const snapshot = await getDocs(collection(db, QUIZ_COLLECTION))
      const list = snapshot.docs.map((d) => ({
        title: d.id,
        questions: (d.data().questions || []) as QuizQuestion[],
      }))
      setQuizzes(list)
    } catch (error) {
      console.log("Error fetching quizzes:", error)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  // const handlePdfUpload = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (!pdfUpload) {
  //     setUploadMessage("Please select a file first.")
  //     return
  //   }
  //
  //   const formData = new FormData()
  //   formData.append("file", pdfUpload) // Send file as "file" key
  //   formData.append("userId", userId)
  //
  //   try {
  //     const response = await fetch(`${apiUrlBase}/upload-pdf`, {
  //       method: "POST",
  //       body: formData,
  //     })
  //
  //     const data = await response.json()
  //     if (response.ok) {
  //       toast.success("PDF uploaded", {
  //         description: `${pdfUpload.name} has been successfully uploaded.`,
  //       })
  //     } else {
  //       setUploadMessage(`Error: ${data.error}`)
  //     }
  //   } catch (error) {
  //     setUploadMessage(`Error uploading file: ${error}`)
  //   }
  //
  //   const currentDate = new Date().toUTCString()
  //   const fileSize = pdfUpload ? `${(pdfUpload.size / (1024 * 1024)).toFixed(2)}` : "0 MB"
  //   const newPdfEntry = {
  //     id: (pdfs.length + 1).toString(),
  //     name: pdfUpload.name,
  //     last_modified: currentDate,
  //     size_mb: fileSize,
  //   }
  //   setPdfs([...pdfs, newPdfEntry])
  //   setIsUploadDialogOpen(false)
  //   setPdfUpload(null)
  // }
const handlePdfUpload = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!pdfUpload) {
    setUploadMessage("Please select a file first.")
    return
  }

  try {
    const uniqueFileName = `${uuidv4()}-${pdfUpload.name}`

    const storageRef = ref(storage, `pdfs/${uniqueFileName}`)

    const uploadTask = uploadBytesResumable(storageRef, pdfUpload)

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100

        console.log(`Upload is ${progress}% done`)
      },
      (error) => {
        console.error(error)

        setUploadMessage(`Upload failed: ${error.message}`)
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

        toast.success("PDF uploaded", {
          description: `${pdfUpload.name} has been successfully uploaded.`,
        })

        const currentDate = new Date().toUTCString()

        const fileSize = `${(
          pdfUpload.size /
          (1024 * 1024)
        ).toFixed(2)} MB`

        const newPdfEntry = {
          id: (pdfs.length + 1).toString(),
          name: pdfUpload.name,
          last_modified: currentDate,
          size_mb: fileSize,
          url: downloadURL,
        }

        setPdfs([...pdfs, newPdfEntry])

        setIsUploadDialogOpen(false)
        setPdfUpload(null)
      }
    )
  } catch (error: any) {
    console.error(error)

    setUploadMessage(`Error uploading file: ${error.message}`)
  }
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

        const response = await fetch(`${apiUrlBase}/delete-pdf`, {
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

  // Upload a code resource to Firebase Storage (same flow as PDF upload)
  const handleCodeUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!codeUpload) {
      setCodeUploadMessage("Please select a file first.")
      return
    }

    try {
      setIsUploadingCode(true)
      setUploadProgress(0)

      const storageRef = ref(storage, `code/${codeUpload.name}`)

      const uploadTask = uploadBytesResumable(storageRef, codeUpload)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100

          setUploadProgress(progress)
        },
        (error) => {
          console.error(error)

          setCodeUploadMessage(`Upload failed: ${error.message}`)
          setIsUploadingCode(false)
        },
        async () => {
          await getDownloadURL(uploadTask.snapshot.ref)

          toast.success("Code resource uploaded", {
            description: `${codeUpload.name} has been successfully uploaded.`,
          })

          await fetchCodeResources()

          setIsUploadingCode(false)
          setUploadProgress(0)
          setIsCodeUploadDialogOpen(false)
          setCodeUpload(null)
          setCodeUploadMessage("")
        },
      )
    } catch (error: any) {
      console.error(error)

      setCodeUploadMessage(`Error uploading file: ${error.message}`)
      setIsUploadingCode(false)
    }
  }

  const handleDeleteCode = (resource: any) => {
    setCodeToDelete(resource)
    setIsCodeDeleteDialogOpen(true)
  }

  const confirmDeleteCode = async () => {
    if (!codeToDelete) return

    try {
      const idToken = await auth.currentUser?.getIdToken()
      const fileName = codeToDelete.path ?? `code/${codeToDelete.filename}`

      const response = await fetch(`${apiUrlBase}/delete-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName, idToken }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete code resource")
      }

      setCodeResources(codeResources.filter((c) => c.id !== codeToDelete.id))
      setIsCodeDeleteDialogOpen(false)
      setCodeToDelete(null)
      toast.success("Code resource deleted", {
        description: `${codeToDelete.filename} has been successfully deleted.`,
      })
    } catch (error) {
      console.error("Error deleting code resource:", error)
      toast.error("Failed to delete code resource")
    }
  }

  // ---- Quiz handlers ----
  const blankOption = (correct = false) => ({ id: uuidv4(), text: "", correct })
  const blankQuestion = (): QuizQuestion => ({
    id: uuidv4(),
    question: "",
    options: [blankOption(true), blankOption(), blankOption(), blankOption()],
  })

  const openAddQuiz = () => {
    setIsEditingQuiz(false)
    setQuizForm({ title: "", questions: [blankQuestion()] })
    setIsQuizDialogOpen(true)
  }

  const openEditQuiz = (quiz: { title: string; questions: QuizQuestion[] }) => {
    setIsEditingQuiz(true)
    setQuizForm({ title: quiz.title, questions: JSON.parse(JSON.stringify(quiz.questions)) })
    setIsQuizDialogOpen(true)
  }

  const updateQuestionText = (qId: string, value: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === qId ? { ...q, question: value } : q)),
    }))
  }

  const updateOptionText = (qId: string, oId: string, value: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => (o.id === oId ? { ...o, text: value } : o)) }
          : q,
      ),
    }))
  }

  const setCorrectOption = (qId: string, oId: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => ({ ...o, correct: o.id === oId })) }
          : q,
      ),
    }))
  }

  const addOption = (qId: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId ? { ...q, options: [...q.options, blankOption()] } : q,
      ),
    }))
  }

  const removeOption = (qId: string, oId: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== qId) return q
        const options = q.options.filter((o) => o.id !== oId)
        // Ensure at least one option stays marked correct
        if (!options.some((o) => o.correct) && options.length > 0) options[0].correct = true
        return { ...q, options }
      }),
    }))
  }

  const addQuestion = () => {
    setQuizForm((prev) => ({ ...prev, questions: [...prev.questions, blankQuestion()] }))
  }

  const removeQuestion = (qId: string) => {
    setQuizForm((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== qId) }))
  }

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quizForm.title) {
      toast.error("Select a PDF", { description: "A quiz must be linked to a PDF." })
      return
    }
    if (quizForm.questions.length === 0) {
      toast.error("Add at least one question")
      return
    }
    for (const q of quizForm.questions) {
      if (!q.question.trim()) {
        toast.error("Every question needs text")
        return
      }
      const filledOptions = q.options.filter((o) => o.text.trim())
      if (filledOptions.length < 2) {
        toast.error("Each question needs at least 2 answer options")
        return
      }
      if (!q.options.some((o) => o.correct && o.text.trim())) {
        toast.error("Each question needs a correct answer marked")
        return
      }
    }

    if (!isEditingQuiz && quizzes.some((qz) => qz.title === quizForm.title)) {
      toast.error("Quiz already exists", { description: "This PDF already has a quiz. Edit it instead." })
      return
    }

    try {
      // Drop blank trailing options before saving
      const cleaned = quizForm.questions.map((q) => ({
        ...q,
        options: q.options.filter((o) => o.text.trim()),
      }))

      await setDoc(doc(db, QUIZ_COLLECTION, quizForm.title), {
        title: quizForm.title,
        questions: cleaned,
      })

      setQuizzes((prev) => {
        const others = prev.filter((qz) => qz.title !== quizForm.title)
        return [...others, { title: quizForm.title, questions: cleaned }]
      })

      setIsQuizDialogOpen(false)
      toast.success(isEditingQuiz ? "Quiz updated" : "Quiz added", {
        description: `${quizForm.title} quiz has been saved.`,
      })
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast.error("Failed to save quiz")
    }
  }

  const handleDeleteQuiz = (title: string) => {
    setQuizToDelete(title)
    setIsQuizDeleteDialogOpen(true)
  }

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return
    try {
      await deleteDoc(doc(db, QUIZ_COLLECTION, quizToDelete))
      setQuizzes((prev) => prev.filter((qz) => qz.title !== quizToDelete))
      setIsQuizDeleteDialogOpen(false)
      setQuizToDelete(null)
      toast.success("Quiz deleted")
    } catch (error) {
      console.error("Error deleting quiz:", error)
      toast.error("Failed to delete quiz")
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
          <TabsTrigger value="code">Code Resources</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
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

        <TabsContent value="code">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsCodeUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Code
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Code Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codeResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="flex items-center">
                        <Code className="mr-2 h-4 w-4 text-gray-500" />
                        {resource.filename}
                      </TableCell>
                      <TableCell>{resource.language}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCode(resource)}
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

        <TabsContent value="quizzes">
          <div className="flex justify-end mb-4">
            <Button onClick={openAddQuiz}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Add New Quiz
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDF</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((quiz) => (
                    <TableRow key={quiz.title}>
                      <TableCell className="flex items-center">
                        <ClipboardList className="mr-2 h-4 w-4 text-gray-500" />
                        {quiz.title}
                      </TableCell>
                      <TableCell>{quiz.questions.length}</TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditQuiz(quiz)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz.title)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {quizzes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No quizzes yet. Add one to gate a PDF's completion.
                      </TableCell>
                    </TableRow>
                  )}
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
        <DialogContent style={customDialogStyles} className="fixed inset-0 m-auto">
          <div className="flex flex-col h-full w-full">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add New Coding Problem</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <form onSubmit={handleAddProblem} className="h-full">
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
                        <SelectContent position="popper" sideOffset={5} align="start">
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
                    <div className="border rounded-md">
                      <Editor
                        height="180px"
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
                <DialogFooter className="mt-4">
                  <Button type="submit">Add Problem</Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Coding Problem Dialog */}
      <Dialog open={isEditProblemDialogOpen} onOpenChange={setIsEditProblemDialogOpen}>
        <DialogContent style={customDialogStyles} className="fixed inset-0 m-auto">
          <div className="flex flex-col h-full w-full">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Coding Problem</DialogTitle>
            </DialogHeader>
            {editingProblem && (
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <form onSubmit={handleUpdateProblem} className="h-full">
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
                          <SelectContent position="popper" sideOffset={5} align="start">
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
                      <div className="border rounded-md">
                        <Editor
                          height="180px"
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
                  <DialogFooter className="mt-4">
                    <Button type="submit">Update Problem</Button>
                  </DialogFooter>
                </form>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent style={customDialogStyles} className="fixed inset-0 m-auto">
          <div className="flex flex-col h-full w-full">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{isEditingQuiz ? "Edit Quiz" : "Add New Quiz"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <form onSubmit={handleSaveQuiz} className="h-full">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quiz-pdf">PDF</Label>
                    {isEditingQuiz ? (
                      <Input id="quiz-pdf" value={quizForm.title} disabled className="bg-gray-100" />
                    ) : (
                      <Select
                        value={quizForm.title}
                        onValueChange={(value) => setQuizForm({ ...quizForm, title: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select the PDF this quiz belongs to" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={5} align="start">
                          {pdfs.map((pdf) => {
                            const title = formatPdfName(pdf.name)
                            return (
                              <SelectItem key={pdf.id} value={title}>
                                {title}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {quizForm.questions.map((question, qIndex) => (
                    <div key={question.id} className="rounded-md border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Label htmlFor={`q-${question.id}`} className="pt-2">
                          Question {qIndex + 1}
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        id={`q-${question.id}`}
                        placeholder="Question text"
                        value={question.question}
                        onChange={(e) => updateQuestionText(question.id, e.target.value)}
                        rows={2}
                      />

                      <div className="space-y-2">
                        <Label>Answer options (select the correct one)</Label>
                        {question.options.map((option) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={!!option.correct}
                              onChange={() => setCorrectOption(question.id, option.id)}
                              className="h-4 w-4 shrink-0"
                            />
                            <Input
                              placeholder="Answer option"
                              value={option.text}
                              onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOption(question.id, option.id)}
                              disabled={question.options.length <= 2}
                              className="shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addOption(question.id)}>
                          <Plus className="mr-1 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addQuestion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit">{isEditingQuiz ? "Update Quiz" : "Add Quiz"}</Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Confirmation Dialog */}
      <AlertDialog open={isQuizDeleteDialogOpen} onOpenChange={setIsQuizDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz for this PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuiz} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Upload Code Dialog */}
      <Dialog
        open={isCodeUploadDialogOpen}
        onOpenChange={(open) => {
          if (isUploadingCode) return
          setIsCodeUploadDialogOpen(open)
          if (!open) {
            setCodeUpload(null)
            setCodeUploadMessage("")
            setUploadProgress(0)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Code Resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCodeUpload}>
            <div className="grid gap-4 py-4">
              {codeUploadMessage && <p className="text-sm text-red-500">{codeUploadMessage}</p>}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code-file" className="text-right">
                  Code File
                </Label>
                <div className="col-span-3">
                  <Input
                    id="code-file"
                    type="file"
                    accept=".ino,.c,.cpp,.h,.py,.js,.ts"
                    onChange={(e) => setCodeUpload(e.target.files ? e.target.files[0] : null)}
                    disabled={isUploadingCode}
                  />
                </div>
              </div>
              {isUploadingCode && (
                <div className="grid gap-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-gray-500 text-center">{Math.round(uploadProgress)}% uploaded</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isUploadingCode || !codeUpload}>
                {isUploadingCode ? "Uploading..." : "Upload Code"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Code Confirmation Dialog */}
      <AlertDialog open={isCodeDeleteDialogOpen} onOpenChange={setIsCodeDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the code resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCode} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
