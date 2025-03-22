"use client"

import { useState, useEffect } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Play, Lightbulb, HelpCircle, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {sampleproblems} from "@/components/sampleproblems";
import {getUser} from "@/lib/getUser";

const problems = sampleproblems;


export default function ArduinoIDE() {
  const [currentProblem, setCurrentProblem] = useState(0)
  const [code, setCode] = useState(problems[currentProblem].initialCode)
  const [output, setOutput] = useState("")
  const [isCorrect, setIsCorrect] = useState(false)
  const [progress, setProgress] = useState(new Array(problems.length).fill(false))
  const [hintsUsed, setHintsUsed] = useState(new Array(problems.length).fill({ viewed: false, closed: false }))
  const [hintAccordionOpen, setHintAccordionOpen] = useState(new Array(problems.length).fill(false))
  const [explanationsAvailable, setExplanationsAvailable] = useState(new Array(problems.length).fill(false))
  const [userId, setUserId] = useState<string>("")

  // Fetch progress on page load
  useEffect(() => {
    const userData = getUser();
    setUserId(userData.user_id);
    const fetchProgress = async () => {
      try {
        const response = await fetch(`http://localhost:8080/get-user-progress?user_id=${userData.user_id}&type=coding-problem`);
        const data = await response.json();

        if (Array.isArray(data)) {
          const progressMap = new Map(data.map(item => [item.material_id, item.completed]));
          const updatedProgress = problems.map(problem => progressMap.get(problem.id) || false);
          setProgress(updatedProgress);

          // Automatically set `currentProblem` to the first incomplete problem
          const nextProblemIndex = updatedProgress.findIndex(completed => !completed);
          setCurrentProblem(nextProblemIndex !== -1 ? nextProblemIndex : 0);
          setCode(problems[nextProblemIndex !== -1 ? nextProblemIndex : 0].initialCode);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchProgress();
  }, []);

  // Function to send code to backend to run
  const runCode = async () => {
    console.log(code)
    const response = await fetch("http://localhost:8080/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });
    const result = await response.json();

    const output = result.output
    setOutput(output)
    const correct = output === problems[currentProblem].expectedOutput
    setIsCorrect(correct)
    console.log(output)
  }

  const handlePrevious = () => {
    if (currentProblem > 0) {
      setCurrentProblem(currentProblem - 1)
      setCode(problems[currentProblem - 1].initialCode)
      setOutput("")
      setIsCorrect(false)
    }
  }

  const handleNext = () => {
    if (currentProblem < problems.length - 1) {
      setCurrentProblem(currentProblem + 1)
      setCode(problems[currentProblem + 1].initialCode)
      setOutput("")
      setIsCorrect(false)
    }
  }

  // Student marks a problem as completed
  const markAsCompleted = async () => {
    if (isCorrect && !progress[currentProblem]) {
      const updatedProgress = [...progress];
      updatedProgress[currentProblem] = true;
      setProgress(updatedProgress);

      try {
        const requestBody = {
          user_id: userId,
          material_id: problems[currentProblem].id,
          type: "coding-problem",
          title: problems[currentProblem].title,
          completed: true,
          completion_date: new Date().toISOString(),
          accessed_at: new Date().toISOString(),
        };

        const response = await fetch("http://localhost:8080/mark-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          console.error("Failed to update progress:", await response.text());
        }
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    }
  };


  const useHint = (action: "view" | "close") => {
    setHintsUsed((prev) => {
      const newHintsUsed = [...prev]
      if (action === "view") {
        newHintsUsed[currentProblem] = { ...newHintsUsed[currentProblem], viewed: true }
      } else if (action === "close") {
        newHintsUsed[currentProblem] = { viewed: true, closed: true }
      }
      return newHintsUsed
    })
  }

  const toggleHintAccordion = () => {
    setHintAccordionOpen((prev) => {
      const newHintAccordionOpen = [...prev]
      newHintAccordionOpen[currentProblem] = !newHintAccordionOpen[currentProblem]
      useHint(newHintAccordionOpen[currentProblem] ? "view" : "close") // Moved useHint call outside conditional
      return newHintAccordionOpen
    })
  }

  const completedCount = progress.filter(Boolean).length

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
              <CardTitle>{problems[currentProblem].title}</CardTitle>
              <Badge variant={problems[currentProblem].difficulty === "Easy" ? "secondary" : "destructive"}>
                {problems[currentProblem].difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{problems[currentProblem].description}</p>
            <Accordion type="single" collapsible value={hintAccordionOpen[currentProblem] ? "hint" : ""}>
              <AccordionItem value="hint">
                <AccordionTrigger onClick={toggleHintAccordion} disabled={hintsUsed[currentProblem].closed}>
                  <div className="flex items-center">
                    {hintsUsed[currentProblem].closed ? (
                      <Lock className="w-4 h-4 mr-2" />
                    ) : (
                      <Lightbulb className="w-4 h-4 mr-2" />
                    )}
                    Hint
                  </div>
                </AccordionTrigger>
                <AccordionContent>{problems[currentProblem].hint}</AccordionContent>
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
                <AccordionContent>{problems[currentProblem].explanation}</AccordionContent>
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
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <code>{output || "No output yet. Run your code to see the results."}</code>
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