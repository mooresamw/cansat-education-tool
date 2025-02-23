"use client"
import ArduinoIDE from "@/components/ArduinoIDE"
import {DashboardLayout} from "@/components/DashboardLayout";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
        <DashboardLayout userType={"student"}>
      <ArduinoIDE />
        </DashboardLayout>
    </main>
  )
}
