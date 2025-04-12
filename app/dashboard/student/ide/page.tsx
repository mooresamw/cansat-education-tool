"use client"
import ArduinoIDE from "@/components/ArduinoIDE"
import {DashboardLayout} from "@/components/DashboardLayout";
import {useEffect, useState} from "react";
import {collection, doc, getDoc} from "firebase/firestore";
import {db} from "@/lib/firebaseConfig";
import Loading from "@/components/Loading";
import {CodingProblem} from "@/lib/CodingProblem";

export default function Home() {
    const[problems, setProblems] = useState<CodingProblem[]>([])
    const [loading, setLoading] = useState(true)
    const fetchCodingProblems = async () => {
      try {
        const problemsCollection = collection(db, "codingProblems")
          console.log(problemsCollection)
        const problemsSnapshot = await getDoc(doc(problemsCollection, "arduino"))
          console.log(problemsSnapshot)
        if (problemsSnapshot.exists()) {
          const problemsData = problemsSnapshot.data().problems
            console.log(problemsData)
          setProblems(problemsData)
            setLoading(false)
        }
      } catch (error) {
        console.log("Error fetching coding problems:", error)
      }
    }
    useEffect(() => {
        fetchCodingProblems()
    }, []);

  if (loading) return <Loading />
  return (
    <main className="min-h-screen bg-background">
        <DashboardLayout userType={"student"}>
      <ArduinoIDE problems={problems} />
        </DashboardLayout>
    </main>
  )
}
