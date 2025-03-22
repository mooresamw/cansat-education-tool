"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { getUser } from "@/lib/getUser"

interface StudentProgress {
  user_id: string
  name: string
  email: string
  total_materials: number
  completed_materials: number
  last_activity: string
}

export function StudentProgressTable() {
  const [students, setStudents] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof StudentProgress>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    const userData = getUser();
    const fetchStudentProgress = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8080/student-progress?user_id=${userData.user_id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch student progress");
        }
        const progressData = await response.json();

        // Fetch user details for each student
        const userDetailsPromises = progressData.map(async (student: any) => {
          const userResponse = await fetch(`http://127.0.0.1:8080/users/${student.user_id}`);
          if (!userResponse.ok) {
            throw new Error(`Failed to fetch user data for user_id: ${student.user_id}`);
          }
          const userData = await userResponse.json();
          return {
            student_id: student.user_id,
            name: userData.name, // Assuming userData has `name`
            email: userData.email, // Assuming userData has `email`
            total_materials: 12, /*student.items.length,*/
            completed_materials: student.items.filter((item: any) => item.completed).length,
            last_activity: student.items[0]?.completion_date || student.items[0]?.accessed_at, // Use last activity timestamp
          };
        });

        const studentsWithUserData = await Promise.all(userDetailsPromises);
        setStudents(studentsWithUserData);
      } catch (error) {
        console.error("Error fetching student progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProgress();
  }, []);


  const handleSort = (field: keyof StudentProgress) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const formatDate = (dateString: string) => {
    if (dateString === "N/A") return "No Activity"
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
    if (percentage < 30) return "bg-red-500"
    if (percentage < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortField === "last_activity") {
      return sortDirection === "asc"
        ? new Date(a.last_activity).getTime() - new Date(b.last_activity).getTime()
        : new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
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

  return (
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
                            <Progress value={(student.completed_materials / student.total_materials) * 100} className="h-2 w-24" />
                            <span className="text-sm">{student.completed_materials}/{student.total_materials}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(student.last_activity)}</TableCell>
                        <TableCell>
                          <Badge variant={student.completed_materials === student.total_materials ? "success" : student.completed_materials > 0 ? "default" : "destructive"}>
                            {student.completed_materials === student.total_materials ? "Completed" : student.completed_materials > 0 ? "In Progress" : "Not Started"}
                          </Badge>
                        </TableCell>
                        <TableCell><Button variant="outline" size="sm">View Details</Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>

            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}