"use client"

import { useEffect, useMemo, useState } from "react"
import { Document, Page } from "react-pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import Loading from "@/components/Loading"
import { getUser } from "@/lib/getUser"
import { Progress } from "@/components/ui/progress"

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
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | undefined>(undefined)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [notes, setNotes] = useState("")
  const [pdfs, setPdfs] = useState<PDFFile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")
  const [completedPdfs, setCompletedPdfs] = useState<CompletedPDF[]>([])
  const [progressPercent, setProgressPercent] = useState(0)

  // When the page loads, fetch the PDF files and user progress from backend
  useEffect(() => {
    const userData = getUser()
    setUserId(userData.user_id)

    const fetchData = async () => {
      try {
        // Fetch PDFs
        const pdfResponse = await fetch("http://localhost:8080/get-pdfs")
        if (!pdfResponse.ok) {
          throw new Error("Failed to fetch PDFs")
        }
        const pdfData: PDFFile[] = await pdfResponse.json()
        setPdfs(pdfData)

        //Fetch user progress
        const progressResponse = await fetch(
          `http://localhost:8080/get-user-progress?user_id=${userData.user_id}&type=training_material`,
        )
        if (!progressResponse.ok) {
          throw new Error("Failed to fetch user progress")
        }
        const progressData: CompletedPDF[] = await progressResponse.json()
        setCompletedPdfs(progressData)

        // Calculate progress percentage
        const progressPercentage = pdfData.length > 0 ? (progressData.length / pdfData.length) * 100 : 0
        setProgressPercent(progressPercentage)

        // Find the first uncompleted PDF
        if (pdfData.length > 0) {
          if(progressData.length === 0) {
            setSelectedPdf(pdfData[0])
          } else {
            const completedIds = progressData.map((item) => item.material_id)
            const firstUncompletedPdf = pdfData.find((pdf) => !completedIds.includes(pdf.id))

            // If all PDFs are completed, show the first one, otherwise show the first uncompleted one
            setSelectedPdf(firstUncompletedPdf || pdfData[0])
          }
        }

        setLoading(false)
      } catch (error) {
        console.log("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  async function markAsCompleted() {
    if (!selectedPdf) return

    try {
      const response = await fetch("http://localhost:8080/mark-progress", {
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
        // Update local state to reflect the newly completed PDF
        const newCompletedPdf = {
          material_id: selectedPdf.id,
          completion_date: new Date().toISOString(),
        }

        const updatedCompletedPdfs = [...completedPdfs, newCompletedPdf]
        setCompletedPdfs(updatedCompletedPdfs)

        // Update progress percentage
        const newProgressPercent = pdfs.length > 0 ? (updatedCompletedPdfs.length / pdfs.length) * 100 : 0
        setProgressPercent(newProgressPercent)

        // Find and load the next uncompleted PDF
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

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset
      if (numPages && newPageNumber === numPages) {
        markAsCompleted()
      }
      return Math.min(Math.max(1, newPageNumber), numPages || 1)
    })
  }

  // Check if the current PDF is completed
  const isPdfCompleted = (pdfId: string) => {
    return completedPdfs.some((pdf) => pdf.material_id === pdfId)
  }

  // Memoize options to prevent unnecessary re-renders
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: "/cmaps/",
      cMapPacked: true,
    }),
    [],
  )

  if (loading) return <Loading />

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-bold">Training Materials</h1>

      {/* Progress bar section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress: {Math.round(progressPercent)}% Complete</span>
          <span className="text-sm font-medium">
            {completedPdfs.length} of {pdfs.length} PDFs
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* PDF completion indicators */}
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
                <span>PDF Viewer</span>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select a PDF" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfs.map((pdf) => (
                      <SelectItem key={pdf.id} value={pdf.id}>
                        <div className="flex items-center">
                          {isPdfCompleted(pdf.id) && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                          {pdf.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-lg overflow-auto h-[600px]">
                {selectedPdf && (
                  <Document file={selectedPdf.url} onLoadSuccess={onDocumentLoadSuccess} options={pdfOptions}>
                    <Page pageNumber={pageNumber} width={800} />
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
                className="h-[600px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}