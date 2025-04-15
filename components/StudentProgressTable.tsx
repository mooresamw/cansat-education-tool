"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { getUser } from "@/lib/getUser"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface StudentProgress {
  user_id: string
  name: string
  email: string
  total_materials: number
  completed_materials: number
  last_activity: string
  items?: Array<{
    id: string
    title: string
    type: string
    completed: boolean
    completion_date?: string
    accessed_at?: string
  }>
}

export function StudentProgressTable() {
  const [students, setStudents] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof StudentProgress>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    const userData = getUser()
    const fetchStudentProgress = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8080/student-progress?user_id=${userData.user_id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch student progress")
        }
        const progressData = await response.json()

        // Fetch user details for each student
        const userDetailsPromises = progressData.map(async (student: any) => {
          const userResponse = await fetch(`http://127.0.0.1:8080/users/${student.user_id}`)
          if (!userResponse.ok) {
            throw new Error(`Failed to fetch user data for user_id: ${student.user_id}`)
          }
          const userData = await userResponse.json()
          return {
            user_id: student.user_id,
            name: userData.name, // Assuming userData has `name`
            email: userData.email, // Assuming userData has `email`
            total_materials: 12 /*student.items.length,*/,
            completed_materials: student.items.filter((item: any) => item.completed).length,
            last_activity: student.items[0]?.completion_date || student.items[0]?.accessed_at, // Use last activity timestamp
            items: student.items, // Store the items for later use
          }
        })

        const studentsWithUserData = await Promise.all(userDetailsPromises)
        setStudents(studentsWithUserData)
      } catch (error) {
        console.error("Error fetching student progress:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentProgress()
  }, [])

  const handleViewDetails = (student: StudentProgress) => {
    setSelectedStudent(student)
    setIsDetailsDialogOpen(true)
  }

  const handleSort = (field: keyof StudentProgress) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "No Activity"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "bg-red-600"
    if (percentage < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortField === "last_activity") {
      return sortDirection === "asc"
        ? new Date(a.last_activity || 0).getTime() - new Date(b.last_activity || 0).getTime()
        : new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime()
    }

    if (sortField === "completed_materials" || sortField === "total_materials") {
      return sortDirection === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
    }

    return sortDirection === "asc" ? a[sortField].localeCompare(b[sortField]) : b[sortField].localeCompare(a[sortField])
  })

  const SortIcon = ({ field }: { field: keyof StudentProgress }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
  }

  const getMaterialStatusIcon = (completed: boolean) => {
    if (completed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Student Progress Overview</span>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-8 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">Loading student progress data...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                      <div className="flex items-center">
                        Student Name
                        <SortIcon field="name" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                      <div className="flex items-center">
                        Email
                        <SortIcon field="email" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("completed_materials")}>
                      <div className="flex items-center">
                        Progress
                        <SortIcon field="completed_materials" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("last_activity")}>
                      <div className="flex items-center">
                        Last Activity
                        <SortIcon field="last_activity" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.length === 0 ? (
                    <TableRow key="no-students-placeholder">
                      <TableCell colSpan={6} className="text-center py-8">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedStudents.map((student) => (
                      <TableRow key={student.user_id || Math.random().toString(36)}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={(student.completed_materials / student.total_materials) * 100}
                              className={`h-2 w-24 ${getProgressColor((student.completed_materials / student.total_materials) * 100)}`}
                            />
                            <span className="text-sm">
                              {student.completed_materials}/{student.total_materials}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(student.last_activity)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.completed_materials === student.total_materials
                                ? "success"
                                : student.completed_materials > 0
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            {student.completed_materials === student.total_materials
                              ? "Completed"
                              : student.completed_materials > 0
                                ? "In Progress"
                                : "Not Started"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(student)}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedStudent?.name}'s Learning Materials</DialogTitle>
            <DialogDescription>Showing all materials and their completion status</DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center px-1">
            <div>
              <span className="text-sm text-muted-foreground">Email: </span>
              <span className="font-medium">{selectedStudent?.email}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Progress: </span>
              <span className="font-medium">
                {selectedStudent?.completed_materials}/{selectedStudent?.total_materials} completed
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 pr-4">
            {!selectedStudent?.items || selectedStudent.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No learning materials data available for this student.</p>
              </div>
            ) : (
              <div className="py-1">
                {selectedStudent.items.map((item, index) => (
                    <div
                        key={item.id || `item-${index}`}
                        className="grid grid-cols-[1fr_120px_180px] gap-4 items-center p-2 rounded-md hover:bg-muted/50"
                    >
                      <div className="font-medium flex items-center gap-2">
                        {getMaterialStatusIcon(item.completed)}
                        <span>{item.title || `Material ${item.id}`}</span>
                      </div>
                      <div>
                        <Badge variant={item.completed ? "success" : "outline"}>
                          {item.completed ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.completed && item.completion_date
                            ? formatDate(item.completion_date)
                            : item.accessed_at
                                ? `Last accessed: ${formatDate(item.accessed_at)}`
                                : "Not started"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Material type: {item.type === "coding-problem"
                        ? "Coding Problem"
                        : item.type === "training_material"
                        ? "PDF resource"
                        : item.type}
                      </div>
                    </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}