"use client"

import { useEffect, useRef, useState, useContext } from "react"
import { Document, Page } from "react-pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, CheckCircle, Download, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { fetchQuizzes, formatPdfName, getQuizForTitle, type QuizQuestion } from "@/lib/quizzes"
import { pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import Loading from "@/components/Loading"
import { Progress } from "@/components/ui/progress"
import { auth, db } from "@/lib/firebaseConfig"
import { apiUrlBase } from "@/lib/configEnv"
import { SignOutContext } from "@/components/DashboardLayout"
import { onAuthStateChanged } from "firebase/auth"
import Editor from "@monaco-editor/react"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDF_OPTIONS = {
  cMapUrl: "/cmaps/",
  cMapPacked: true,
}

interface PDFFile {
  id: string
  name: string
  url: string
}

interface CompletedPDF {
  material_id: string
  completion_date: string
}

interface CodeResource {
  id: string
  name: string
  description: string
  language: string
  code: string
  filename: string
}

export default function StudentTrainingMaterials() {
  const { isSigningOut } = useContext(SignOutContext)
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | undefined>(undefined)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfs, setPdfs] = useState<PDFFile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [completedPdfs, setCompletedPdfs] = useState<CompletedPDF[]>([])
  const [progressPercent, setProgressPercent] = useState(0)
  const [activeTab, setActiveTab] = useState("pdfs")

  const [codeResources, setCodeResources] = useState<CodeResource[]>([])
  const [selectedCodeResource, setSelectedCodeResource] = useState<CodeResource | undefined>(undefined)

  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(700)

  // Quiz gating: a passing quiz is required before a PDF is marked complete.
  // All quizzes are fetched once on load and looked up locally by PDF title.
  const [quizzesByTitle, setQuizzesByTitle] = useState<Record<string, QuizQuestion[]>>({})
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const getQuiz = (pdf: PDFFile): QuizQuestion[] | undefined => {
    const title = formatPdfName(pdf.name)
    return quizzesByTitle[title] ?? getQuizForTitle(title)
  }

  useEffect(() => {
    const updateWidth = () => {
      if (pdfContainerRef.current) {
        setPageWidth(pdfContainerRef.current.clientWidth)
      }
    }
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    if (pdfContainerRef.current) observer.observe(pdfContainerRef.current)
    return () => observer.disconnect()
  }, [selectedPdf, loading])

  useEffect(() => {
    if (codeResources.length > 0 && !selectedCodeResource) {
      setSelectedCodeResource(codeResources[0])
    }
  }, [codeResources])

  const downloadCode = () => {
    if (!selectedCodeResource) return

    const blob = new Blob([selectedCodeResource.code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = selectedCodeResource.filename
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
      }
    })
    return () => unsubscribe()
  }, [])

  // Fetch every quiz once on load so completion never has to wait on a per-PDF request
  useEffect(() => {
    fetchQuizzes(db)
      .then(setQuizzesByTitle)
      .catch((error) => console.error("Error fetching quizzes:", error))
  }, [])

  // Fetch PDFs and progress
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!isMounted || isSigningOut || !userId) return

      try {
        setLoading(true)
        const pdfResponse = await fetch(`${apiUrlBase}/get-pdfs`)
        if (!pdfResponse.ok) throw new Error("Failed to fetch PDFs")
        const pdfData: PDFFile[] = await pdfResponse.json()
        if (!isMounted) return
        setPdfs(pdfData)

        const codeResponse = await fetch(`${apiUrlBase}/get-code`)
        if (!codeResponse.ok) throw new Error("Failed to fetch code resources")
        const codeData: CodeResource[] = await codeResponse.json()
        if (!isMounted) return
        setCodeResources(codeData)

        const progressResponse = await fetch(
          `${apiUrlBase}/get-user-progress?user_id=${userId}&type=training_material`,
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
      const response = await fetch(`${apiUrlBase}/mark-progress`, {
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
        const quiz = getQuiz(selectedPdf)
        if (quiz && quiz.length > 0) {
          openQuiz(quiz)
        } else {
          markAsCompleted()
        }
      }
      return Math.min(Math.max(1, newPageNumber), numPages || 1)
    })
  }

  const openQuiz = (quiz: QuizQuestion[]) => {
    setQuizQuestions(quiz)
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizOpen(true)
  }

  const isQuizPassed = () =>
    quizQuestions.length > 0 &&
    quizQuestions.every((q) => q.options.find((o) => o.id === quizAnswers[q.id])?.correct)

  const handleQuizSubmit = () => {
    setQuizSubmitted(true)
    if (isQuizPassed()) {
      setQuizOpen(false)
      markAsCompleted()
    }
  }

  const isPdfCompleted = (pdfId: string) => {
    return completedPdfs.some((pdf) => pdf.material_id === pdfId)
  }

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
          <div className="hidden md:flex flex-wrap gap-2 mb-4">
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
                {index + 1}. {formatPdfName(pdf.name)}
              </div>
            ))}
          </div>

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
              <div className="mb-4 block md:hidden">
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select a PDF" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfs.map((pdf) => (
                      <SelectItem key={pdf.id} value={pdf.id}>
                        <div className="flex items-center">
                          {isPdfCompleted(pdf.id) && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                          {formatPdfName(pdf.name)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div ref={pdfContainerRef} className="w-full max-w-[700px] mx-auto">
                <div className="border rounded-lg overflow-hidden w-fit mx-auto">
                  {selectedPdf && (
                    <Document file={selectedPdf.url} onLoadSuccess={onDocumentLoadSuccess} options={PDF_OPTIONS}>
                      <Page pageNumber={pageNumber} width={pageWidth} />
                    </Document>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 max-w-[700px] mx-auto">
                <Button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
                  <ChevronLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <p className="text-sm">
                  Page {pageNumber} of {numPages}
                </p>
                <Button onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)}>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 sm:ml-2" />
                </Button>
              </div>

              {selectedPdf &&
                !isPdfCompleted(selectedPdf.id) &&
                numPages !== null &&
                pageNumber >= numPages &&
                (getQuiz(selectedPdf)?.length ?? 0) > 0 && (
                  <div className="mt-4 max-w-[700px] mx-auto text-center">
                    <Button onClick={() => openQuiz(getQuiz(selectedPdf)!)}>Take Quiz to Complete</Button>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coding Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select
                  value={selectedCodeResource?.id}
                  onValueChange={(value) => {
                    const newSelectedCode = codeResources.find((code) => code.id === value)
                    if (newSelectedCode) {
                      setSelectedCodeResource(newSelectedCode)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a code example" />
                  </SelectTrigger>
                  <SelectContent>
                    {codeResources.map((codeResource) => (
                      <SelectItem key={codeResource.id} value={codeResource.id}>
                        {codeResource.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCodeResource && <p className="text-gray-600 mb-4">{selectedCodeResource.description}</p>}

              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  defaultLanguage={selectedCodeResource?.language || "cpp"}
                  value={selectedCodeResource?.code || ""}
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
                <Button onClick={downloadCode} disabled={!selectedCodeResource}>
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedCodeResource?.name || "Code"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Quiz{selectedPdf ? `: ${formatPdfName(selectedPdf.name)}` : ""}</DialogTitle>
            <DialogDescription>
              Answer every question correctly to complete this material and unlock the next one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {quizQuestions.map((q, qIndex) => {
              const selected = quizAnswers[q.id]
              const correctOptionId = q.options.find((o) => o.correct)?.id
              return (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    {qIndex + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option) => {
                      const isSelected = selected === option.id
                      let stateClass = "border-gray-200 hover:bg-gray-50"
                      if (quizSubmitted && option.id === correctOptionId) {
                        stateClass = "border-green-400 bg-green-50 text-green-800"
                      } else if (quizSubmitted && isSelected) {
                        stateClass = "border-red-400 bg-red-50 text-red-800"
                      } else if (isSelected) {
                        stateClass = "border-primary ring-1 ring-primary"
                      }
                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: option.id }))}
                          className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${stateClass}`}
                        >
                          <span>{option.text}</span>
                          {quizSubmitted && option.id === correctOptionId && (
                            <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                          )}
                          {quizSubmitted && isSelected && option.id !== correctOptionId && (
                            <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {quizSubmitted && !isQuizPassed() && (
            <p className="text-sm font-medium text-red-600">
              Some answers are incorrect. Review the highlighted answers and try again.
            </p>
          )}

          <DialogFooter>
            {quizSubmitted && !isQuizPassed() ? (
              <Button
                onClick={() => {
                  setQuizSubmitted(false)
                  setQuizAnswers({})
                }}
              >
                Try Again
              </Button>
            ) : (
              <Button
                onClick={handleQuizSubmit}
                disabled={quizQuestions.some((q) => !quizAnswers[q.id])}
              >
                Submit Quiz
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
