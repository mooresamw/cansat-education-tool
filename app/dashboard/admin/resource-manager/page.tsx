"use client"

import React, {useEffect} from "react"
import { useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {type File, FileText, Plus, Trash2, Upload} from "lucide-react"

export default function AdminPdfManager() {
  const [pdfs, setPdfs] = useState([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pdfToDelete, setPdfToDelete] = useState<string | null>(null)
  const [pdfUpload, setPdfUpload] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState("");
  const [newPdf, setNewPdf] = useState({
    file: null as File | null,
  })


    // Fetch user data on page load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8080/get-pdfs", {});
        const data = await response.json();
        setPdfs(data);
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    }

    fetchUsers();
  }, []);
  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdfUpload) {
      setUploadMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfUpload); // Send file as "file" key

    try {
      const response = await fetch("http://localhost:8080/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setUploadMessage(`File uploaded successfully! View: ${data.url}`);
      } else {
        setUploadMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setUploadMessage(`Error uploading file: ${error}`);
    }

    const currentDate = new Date().toUTCString();
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
        // Find the PDF object to get its name
        const pdf = pdfs.find(p => p.id === pdfToDelete);
        if (!pdf) return;

        // Make API call to delete the file
        const response = await fetch('http://localhost:8080/delete-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file_name: pdf.name })
        });

        if (!response.ok) {
          throw new Error('Failed to delete PDF');
        }

        // Update state only if deletion is successful
        setPdfs(pdfs.filter((pdf) => pdf.id !== pdfToDelete));
        setIsDeleteDialogOpen(false);
        setPdfToDelete(null);
        toast.success("PDF Deleted", {
          description: `${pdfToDelete} has been successfully deleted.`,
        })

      } catch (error) {
        console.error('Error deleting PDF:', error);
        // Optionally add error handling UI feedback here
        // For example: setErrorMessage('Failed to delete PDF');
      }
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">PDF Resource Management</h1>
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
