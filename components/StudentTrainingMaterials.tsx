"use client"

import { useEffect, useMemo, useState, useContext } from "react"
import { Document, Page } from "react-pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, CheckCircle, Download } from "lucide-react"
import { pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import Loading from "@/components/Loading"
import { Progress } from "@/components/ui/progress"
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebaseConfig"
import { SignOutContext } from "@/components/DashboardLayout"
import { onAuthStateChanged } from "firebase/auth"
import Editor from "@monaco-editor/react"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFFile {
  id: string
  name: string
  url: string
}

interface CompletedPDF {
  material_id: string
  completion_date: string
}

export default function StudentTrainingMaterials() {
  const { isSigningOut } = useContext(SignOutContext)
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | undefined>(undefined)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [notes, setNotes] = useState("")
  const [pdfs, setPdfs] = useState<PDFFile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [completedPdfs, setCompletedPdfs] = useState<CompletedPDF[]>([])
  const [progressPercent, setProgressPercent] = useState(0)
  const [activeTab, setActiveTab] = useState("pdfs")

  // Sample Arduino code for the Monaco Editor
  const sampleArduinoCode = `// Basic CanSat Sensor Reading Example
void setup() {
  Serial.begin(9600); // Initialize serial communication
  pinMode(A0, INPUT); // Set analog pin A0 as input for sensor
}

void loop() {
  int sensorValue = analogRead(A0); // Read sensor value
  float voltage = sensorValue * (5.0 / 1023.0); // Convert to voltage
  Serial.print("Sensor Voltage: ");
  Serial.print(voltage);
  Serial.println("V");
  delay(1000); // Wait for 1 second
}
`

  // Download function for Arduino code
  const downloadArduinoCode = () => {
    const blob = new Blob([sampleArduinoCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "CanSatSensorExample.ino"
    link.click()
    URL.revokeObjectURL(url)
  }

  // Set up authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        setUserId(null)
        setNotes("")
      }
    })
    return () => unsubscribe()
  }, [])

  // Fetch PDFs and progress
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!isMounted || isSigningOut || !userId) return

      try {
        setLoading(true)
        const pdfResponse = await fetch("https://cansat-education-tool.onrender.com/get-pdfs")
        if (!pdfResponse.ok) throw new Error("Failed to fetch PDFs")
        const pdfData: PDFFile[] = await pdfResponse.json()
        if (!isMounted) return
        setPdfs(pdfData)

        const progressResponse = await fetch(
          `https://cansat-education-tool.onrender.com/get-user-progress?user_id=${userId}&type=training_material`
        )
        if (!progressResponse.ok) throw new Error("Failed to fetch user progress")
        const progressData: CompletedPDF[] = await progressResponse.json()
        if (!isMounted) return
        setCompletedPdfs(progressData)

        const progressPercentage = pdfData.length > 0 ? (progressData.length / pdfData.length) * 100 : 0
        setProgressPercent(progressPercentage)

        if (pdfData.length > 0) {
          const completedIds = progressData.map((item) => item.material_id)
          const firstUncompletedPdf = pdfData.find((pdf) => !completedIds.includes(pdf.id))
          setSelectedPdf(firstUncompletedPdf || pdfData[0])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (userId) fetchData()
    return () => {
      isMounted = false
    }
  }, [userId, isSigningOut])

  // Load notes when selected PDF changes
  useEffect(() => {
    let isMounted = true

    const loadNotes = async () => {
      if (!isMounted || !selectedPdf || !userId || isSigningOut) return

      try {
        const user = auth.currentUser
        if (!user) {
          console.log("No authenticated user; skipping note loading")
          return
        }
        const noteDocRef = doc(db, "users", userId, "notes", selectedPdf.id)
        const noteDoc = await getDoc(noteDocRef)
        if (!isMounted) return
        setNotes(noteDoc.exists() ? noteDoc.data().content || "" : "")
      } catch (error: any) {
        console.error("Error loading notes:", error)
        if (error.code === "permission-denied") {
          console.log("Permission denied; likely due to sign-out")
          if (isMounted) setNotes("")
        }
      }
    }

    loadNotes()
    return () => {
      isMounted = false
    }
  }, [selectedPdf, userId, isSigningOut])

  // Save notes to Firestore
  const saveNotes = async () => {
    if (!selectedPdf || !userId || isSigningOut) return

    try {
      const user = auth.currentUser
      if (!user) {
        console.log("No authenticated user; skipping note saving")
        return
      }
      const noteDocRef = doc(db, "users", userId, "notes", selectedPdf.id)
      await setDoc(noteDocRef, {
        content: notes,
        pdfId: selectedPdf.id,
        updatedAt: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error saving notes:", error)
      if (error.code !== "permission-denied") {
        alert("Failed to save notes. Please try again.")
      }
    }
  }

  // Delete notes from Firestore
  const deleteNotes = async () => {
    if (!selectedPdf || !userId || isSigningOut) return

    try {
      const user = auth.currentUser
      if (!user) {
        console.log("No authenticated user; skipping note deletion")
        return
      }
      const noteDocRef = doc(db, "users", userId, "notes", selectedPdf.id)
      await deleteDoc(noteDocRef)
      setNotes("")
    } catch (error: any) {
      console.error("Error deleting notes:", error)
      if (error.code !== "permission-denied") {
        alert("Failed to delete notes. Please try again.")
      }
    }
  }

  // Mark PDF as completed and move to next uncompleted PDF
  const markAsCompleted = async () => {
    if (!selectedPdf || !userId || isSigningOut) return
    if (isPdfCompleted(selectedPdf.id)) return // Skip if already completed

    try {
      const user = auth.currentUser
      if (!user) {
        console.log("No authenticated user; skipping mark as completed")
        return
      }
      const response = await fetch("https://cansat-education-tool.onrender.com/mark-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          material_id: selectedPdf.id,
          type: "training_material",
          title: selectedPdf.name,
          accessed_at: new Date().toISOString(),
          completed: true,
          completion_date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const newCompletedPdf = {
          material_id: selectedPdf.id,
          completion_date: new Date().toISOString(),
        }

        const updatedCompletedPdfs = [...completedPdfs, newCompletedPdf]
        setCompletedPdfs(updatedCompletedPdfs)

        const newProgressPercent = pdfs.length > 0 ? (updatedCompletedPdfs.length / pdfs.length) * 100 : 0
        setProgressPercent(newProgressPercent)

        const completedIds = updatedCompletedPdfs.map((item) => item.material_id)
        const nextUncompletedPdf = pdfs.find((pdf) => !completedIds.includes(pdf.id))

        if (nextUncompletedPdf) {
          setSelectedPdf(nextUncompletedPdf)
          setPageNumber(1)
          setNumPages(null)
        }
      }
    } catch (error) {
      console.error("Error sending completion data", error)
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset
      if (numPages && newPageNumber === numPages && selectedPdf && !isPdfCompleted(selectedPdf.id)) {
        markAsCompleted()
      }
      return Math.min(Math.max(1, newPageNumber), numPages || 1)
    })
  }

  const isPdfCompleted = (pdfId: string) => {
    return completedPdfs.some((pdf) => pdf.material_id === pdfId)
  }

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: "/cmaps/",
      cMapPacked: true,
    }),
    [],
  )

  if (loading || !userId) return <Loading />

  return (
    <div className="flex flex-col space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pdfs">PDF Resources</TabsTrigger>
          <TabsTrigger value="coding">Coding Resources</TabsTrigger>
        </TabsList>

        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress: {Math.round(progressPercent)}% Complete</span>
            <span className="text-sm font-medium">
              {completedPdfs.length} of {pdfs.length} PDFs
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <TabsContent value="pdfs" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {pdfs.map((pdf, index) => (
              <div
                key={pdf.id}
                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 cursor-pointer ${
                  isPdfCompleted(pdf.id)
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-gray-100 text-gray-800 border border-gray-300"
                } ${selectedPdf?.id === pdf.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedPdf(pdf)}
              >
                {isPdfCompleted(pdf.id) && <CheckCircle className="h-3 w-3" />}
                {index + 1}. {pdf.name.length > 15 ? `${pdf.name.substring(0, 15)}...` : pdf.name}
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <div className="w-2/3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {selectedPdf && isPdfCompleted(selectedPdf.id) && (
                      <span className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> Completed
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Select
                      value={selectedPdf?.id}
                      onValueChange={(value) => {
                        const newSelectedPdf = pdfs.find((pdf) => pdf.id === value)
                        if (newSelectedPdf) {
                          setSelectedPdf(newSelectedPdf)
                          setPageNumber(1)
                          setNumPages(null)
                        }
                      }}
                    >
                      <SelectTrigger className="block md:hidden">
                        <SelectValue placeholder="Select a PDF" />
                      </SelectTrigger>
                      <SelectContent>
                        {pdfs.map((pdf) => (
                          <SelectItem key={pdf.id} value={pdf.id}>
                            <div className="flex items-center">
                              {isPdfCompleted(pdf.id) && (
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              )}
                              {pdf.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg overflow-auto h-[400px] w-[900px]">
                    {selectedPdf && (
                      <Document file={selectedPdf.url} onLoadSuccess={onDocumentLoadSuccess} options={pdfOptions}>
                        <Page pageNumber={pageNumber} width={750} />
                      </Document>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <Button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <p>
                      Page {pageNumber} of {numPages}
                    </p>
                    <Button onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add your notes here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-[400px] mb-2"
                    disabled={isSigningOut || !userId}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={saveNotes} disabled={!selectedPdf || !notes.trim() || isSigningOut || !userId}>
                      Save Notes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deleteNotes}
                      disabled={!selectedPdf || !notes || isSigningOut || !userId}
                    >
                      Delete Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="coding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coding Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Below is a sample Arduino sketch for reading sensor data. You can download this code and use it in the Arduino IDE installed on your computer.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  defaultLanguage="cpp"
                  defaultValue={sampleArduinoCode}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                  }}
                />
              </div>
              <div className="mt-4">
                <Button onClick={downloadArduinoCode}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Arduino Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}