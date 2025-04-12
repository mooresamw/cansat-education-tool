"use client"

import { useState, useEffect } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Play, Lightbulb, HelpCircle, Lock, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUser } from "@/lib/getUser"
import type { CodingProblem } from "@/lib/CodingProblem"
import theme from "tailwindcss/defaultTheme";

interface ArduinoIDEProps {
  problems: CodingProblem[]
}

export default function ArduinoIDE({ problems }: ArduinoIDEProps) {
  const [currentProblem, setCurrentProblem] = useState(0)
  const [code, setCode] = useState("")
  const [output, setOutput] = useState("")
  const [isCorrect, setIsCorrect] = useState(false)
  const [progress, setProgress] = useState<boolean[]>([])
  const [hintsUsed, setHintsUsed] = useState<{ viewed: boolean; closed: boolean }[]>([])
  const [hintAccordionOpen, setHintAccordionOpen] = useState<boolean[]>([])
  const [explanationsAvailable, setExplanationsAvailable] = useState<boolean[]>([])
  const [userId, setUserId] = useState<string>("")
  const [hintAction, setHintAction] = useState<"view" | "close" | null>(null)

  // Utility function to fix escaped newlines
  const unescapeNewlines = (str: string): string => {
    return str.replace(/\\n/g, "\n").replace(/\\t/g, "\t")
  }

  useEffect(() => {
    // Initialize state based on problems length
    setProgress(new Array(problems.length).fill(false))
    setHintsUsed(new Array(problems.length).fill({ viewed: false, closed: false }))
    setHintAccordionOpen(new Array(problems.length).fill(false))
    setExplanationsAvailable(new Array(problems.length).fill(false))
    setCode(problems.length > 0 ? unescapeNewlines(problems[0].initialCode) : "")

    const userData = getUser()
    setUserId(userData.user_id)
    const fetchProgress = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/get-user-progress?user_id=${userData.user_id}&type=coding-problem`,
        )
        const data = await response.json()

        if (Array.isArray(data) && problems.length > 0) {
          const progressMap = new Map(data.map((item) => [item.material_id, item.completed]))
          const updatedProgress = problems.map((problem) => progressMap.get(problem.id) || false)
          setProgress(updatedProgress)

          const nextProblemIndex = updatedProgress.findIndex((completed) => !completed)
          const safeIndex =
            problems.length > 0
              ? Math.min(Math.max(nextProblemIndex !== -1 ? nextProblemIndex : 0, 0), problems.length - 1)
              : 0
          setCurrentProblem(safeIndex)
          setCode(problems[safeIndex] ? unescapeNewlines(problems[safeIndex].initialCode) : "")
        }
      } catch (error) {
        console.error("Error fetching progress:", error)
        if (problems.length > 0) {
          setCurrentProblem(0)
          setCode(unescapeNewlines(problems[0].initialCode))
        }
      }
    }

    fetchProgress()
  }, [problems])

  useEffect(() => {
    if (hintAction) {
      setHintsUsed((prev) => {
        const newHintsUsed = [...prev]
        if (hintAction === "view") {
          newHintsUsed[currentProblem] = { ...newHintsUsed[currentProblem], viewed: true }
        } else if (hintAction === "close") {
          newHintsUsed[currentProblem] = { viewed: true, closed: true }
        }
        return newHintsUsed
      })
      setHintAction(null) // Reset hintAction after applying the effect
    }
  }, [hintAction, currentProblem])

  const runCode = async () => {
    const response = await fetch("http://localhost:8080/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    const result = await response.json()
    const output = result.output
    setOutput(output)
    const correct = output === problems[currentProblem]?.expectedOutput
    setIsCorrect(correct)
  }

  const handlePrevious = () => {
    if (currentProblem > 0) {
      setCurrentProblem(currentProblem - 1)
      setCode(problems[currentProblem - 1] ? unescapeNewlines(problems[currentProblem - 1].initialCode) : "")
      setOutput("")
      setIsCorrect(false)
    }
  }

  const handleNext = () => {
    if (currentProblem < problems.length - 1) {
      setCurrentProblem(currentProblem + 1)
      setCode(problems[currentProblem + 1] ? unescapeNewlines(problems[currentProblem + 1].initialCode) : "")
      setOutput("")
      setIsCorrect(false)
    }
  }

  const markAsCompleted = async () => {
    if (isCorrect && !progress[currentProblem]) {
      const updatedProgress = [...progress]
      updatedProgress[currentProblem] = true
      setProgress(updatedProgress)

      try {
        const requestBody = {
          user_id: userId,
          material_id: problems[currentProblem].id,
          type: "coding-problem",
          title: problems[currentProblem].title,
          completed: true,
          completion_date: new Date().toISOString(),
          accessed_at: new Date().toISOString(),
        }

        const response = await fetch("http://localhost:8080/mark-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          console.error("Failed to update progress:", await response.text())
        }
      } catch (error) {
        console.error("Error updating progress:", error)
      }
    }
  }

  const toggleHintAccordion = () => {
    setHintAccordionOpen((prev) => {
      const newHintAccordionOpen = [...prev]
      newHintAccordionOpen[currentProblem] = !newHintAccordionOpen[currentProblem]
      setHintAction(newHintAccordionOpen[currentProblem] ? "view" : "close")
      return newHintAccordionOpen
    })
  }

  const completedCount = progress.filter(Boolean).length

  // Function to get difficulty badge color
  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-500 text-amber-900"
      case "Hard":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!problems || problems.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>No Problems Available</AlertTitle>
          <AlertDescription>No coding problems were loaded. Please try again or contact support.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Progress value={(completedCount / problems.length) * 100} className="w-full" />
        <p className="text-sm text-gray-600 mt-2">
          {completedCount} of {problems.length} problems completed
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CardTitle>
                  {problems.length > 0 && currentProblem >= 0 && currentProblem < problems.length
                    ? problems[currentProblem].title
                    : "Loading Problem..."}
                </CardTitle>
                {progress[currentProblem] && (
                  <Badge className="bg-green-500 text-white flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Completed
                  </Badge>
                )}
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs ${
                  problems.length > 0 && problems[currentProblem]?.difficulty
                    ? getDifficultyBadgeClass(problems[currentProblem].difficulty)
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {problems.length > 0 && problems[currentProblem]?.difficulty
                  ? problems[currentProblem].difficulty
                  : "Unknown"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{problems[currentProblem]?.description || "No description available."}</p>
            <Accordion type="single" collapsible value={hintAccordionOpen[currentProblem] ? "hint" : ""}>
              <AccordionItem value="hint">
                <AccordionTrigger onClick={toggleHintAccordion} disabled={hintsUsed[currentProblem]?.closed}>
                  <div className="flex items-center">
                    {hintsUsed[currentProblem]?.closed ? (
                      <Lock className="w-4 h-4 mr-2" />
                    ) : (
                      <Lightbulb className="w-4 h-4 mr-2" />
                    )}
                    Hint
                  </div>
                </AccordionTrigger>
                <AccordionContent>{problems[currentProblem]?.hint || "No hint available."}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="explanation">
                <AccordionTrigger disabled={!explanationsAvailable[currentProblem]}>
                  <div className="flex items-center">
                    {explanationsAvailable[currentProblem] ? (
                      <HelpCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Explanation
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {problems[currentProblem]?.explanation || "No explanation available."}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        <div className="col-span-1 space-y-4">
          <Card>
            <CardContent className="p-0">
              <Editor
                height="400px"
                defaultLanguage="cpp"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  tabSize: 2,
                  insertSpaces: true,
                  theme: "vs-light",
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-accent p-4 rounded-md overflow-x-auto">
                <code className="text-primary">{output || "No output yet. Run your code to see the results."}</code>
              </pre>
              {output && (
                <Alert className="mt-4" variant={isCorrect ? "default" : "destructive"}>
                  <AlertTitle>{isCorrect ? "Correct!" : "Incorrect"}</AlertTitle>
                  <AlertDescription>
                    {isCorrect
                      ? "Your solution produces the expected output. Great job!"
                      : "Your solution doesn't produce the expected output. Try again!"}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <Button onClick={handlePrevious} disabled={currentProblem === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button onClick={handleNext} disabled={currentProblem === problems.length - 1}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={runCode} variant="default">
            <Play className="mr-2 h-4 w-4" /> Run Code
          </Button>
          <Button onClick={markAsCompleted} variant="secondary" disabled={!isCorrect || progress[currentProblem]}>
            Mark as Completed
          </Button>
        </div>
      </div>
    </div>
  )
}