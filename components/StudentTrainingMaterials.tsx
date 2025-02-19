"use client"

import {useMemo, useState} from "react"
import { Document, Page } from "react-pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { pdfjs } from 'react-pdf';
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Mock data for PDF files
const pdfFiles = [
  { id: "1", name: "Introduction to Space", url: "/pdfs/introduction-to-space.pdf" },
  { id: "2", name: "Introduction to Satellite", url: "/pdfs/intro-to-satellite.pdf" },
]

export default function StudentTrainingMaterials() {
  const [selectedPdf, setSelectedPdf] = useState(pdfFiles[0])
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [notes, setNotes] = useState("")

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1))
  }

  // Memoize options to prevent unnecessary re-renders
  const pdfOptions = useMemo(() => ({
    cMapUrl: "/cmaps/",
    cMapPacked: true,
  }), []);

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-bold">Training Materials</h1>
      <div className="flex space-x-4">
        <div className="w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>PDF Viewer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select
                  value={selectedPdf.id}
                  onValueChange={(value) => setSelectedPdf(pdfFiles.find((pdf) => pdf.id === value) || pdfFiles[0])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a PDF" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfFiles.map((pdf) => (
                      <SelectItem key={pdf.id} value={pdf.id}>
                        {pdf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-lg overflow-auto h-[600px]">
                <Document
                  file={selectedPdf.url}
                  onLoadSuccess={onDocumentLoadSuccess}
                  options={pdfOptions} // Memoized to prevent re-renders
                >
                  <Page pageNumber={pageNumber} width={800} />
                </Document>
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