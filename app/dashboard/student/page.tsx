"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiBookOpen, HiChip, HiChatAlt, HiMail } from "react-icons/hi";

import { checkUserRole } from "@/lib/checkAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function StudentDashboard() {
  const userRole = checkUserRole(["admin", "instructor", "student"]);
  const router = useRouter();

  // If user role is invalid, show fallback or redirect
  if (!userRole) return <p className="text-center mt-10">Loading...</p>;

  const openIDE = () => router.push("/dashboard/student/ide");
  const goToChat = () => router.push("/dashboard/student/messageStudent");
  const messageInstructor = () => router.push("/dashboard/student/message");

  return (
    <div className="bg-black min-h-screen text-white">
      <DashboardLayout userType="student">
        <main className="max-w-6xl mx-auto w-full px-4 py-12">
          {/* Header / Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Student Dashboard</h1>

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Access Resources */}
            <Card className="bg-gray-900 border border-gray-800 rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiBookOpen className="text-3xl text-blue-500 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-white text-xl">Access Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Explore training materials and resources to help you build your CanSat project.
                </p>
                <Link href="/dashboard/student/training-materials">
                  <Button className="bg-white text-black hover:bg-gray-200">
                    View Training Materials
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card 2: Virtual Arduino IDE */}
            <Card className="bg-gray-900 border border-gray-800 rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiChip className="text-3xl text-green-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-white text-xl">Virtual Arduino IDE</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Code and test your CanSat firmware directly in your browser.
                </p>
                <Button onClick={openIDE} className="bg-white text-black hover:bg-gray-200">
                  Open IDE
                </Button>
              </CardContent>
            </Card>

            {/* Card 3: Collaboration Tools */}
            <Card className="bg-gray-900 border border-gray-800 rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiChatAlt className="text-3xl text-purple-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-white text-xl">Collaboration Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Chat and collaborate with teammates in real time.
                </p>
                <Button onClick={goToChat} className="bg-white text-black hover:bg-gray-200">
                  Join Team Chat
                </Button>
              </CardContent>
            </Card>

            {/* Card 4: Direct Messaging */}
            <Card className="bg-gray-900 border border-gray-800 rounded-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="flex items-center space-x-3">
                <HiMail className="text-3xl text-yellow-400 transition-transform duration-300 hover:scale-110" />
                <CardTitle className="text-white text-xl">Direct Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Privately message your instructor for feedback or questions.
                </p>
                <Button onClick={messageInstructor} className="bg-white text-black hover:bg-gray-200">
                  Message Instructor
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </DashboardLayout>
    </div>
  );
}
