"use client"

import { useEffect, useMemo, useState } from "react"
import { Document, Page } from "react-pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { pdfjs } from 'react-pdf';
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import Loading from "@/components/Loading";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFFile {
  id: string;
  name: string;
  url: string;
}

export default function StudentTrainingMaterials() {
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | undefined>(undefined)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [notes, setNotes] = useState("")
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true)

  // When the page loads, fetch the PDF files from backend
  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const response = await fetch("http://localhost:8080/get-pdfs");
        if (!response.ok) {
          throw new Error("Failed to fetch PDFs");
        }

        const data: PDFFile[] = await response.json();
        setPdfs(data);
        setSelectedPdf(data[0]) // Set the first PDF as selected by default
        setLoading(false);
      } catch (error) {
        console.log("Error fetching PDFs from PDF", error);
      }
    };

    fetchPDFs();
  }, []);

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

  if (loading) return <Loading />;

  // Make sure selectedPdf is defined before accessing its id
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
                  value={selectedPdf?.id} // Use optional chaining to handle undefined
                  onValueChange={(value) => setSelectedPdf(pdfs.find((pdf) => pdf.id === value) || pdfs[0])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a PDF" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfs.map((pdf) => (
                      <SelectItem key={pdf.id} value={pdf.id}>
                        {pdf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-lg overflow-auto h-[600px]">
                {/* Only render Document if selectedPdf is defined */}
                {selectedPdf && (
                  <Document
                    file={selectedPdf.url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    options={pdfOptions} // Memoized to prevent re-renders
                  >
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
