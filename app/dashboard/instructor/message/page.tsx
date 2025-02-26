"use client";

import { useEffect, useState, useRef } from 'react';
import { auth, db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiMessageCircle } from "react-icons/fi";
import { getMessages } from "@/lib/firestoreUtil"; // Assuming this is your utility file

export default function InstructorMessagePage() {
  const [user, setUser] = useState<any>(null); // Store logged-in instructor
  const [students, setStudents] = useState<any[]>([]); // Store list of students
  const [selectedStudent, setSelectedStudent] = useState<any>(null); // The student being messaged
  const [message, setMessage] = useState(''); // Current message input
  const [messages, setMessages] = useState<any[]>([]); // Store conversation history
  const messagesEndRef = useRef<HTMLDivElement>(null); // Auto-scroll reference

  // Fetch the currently authenticated user (instructor)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Fetch students for the instructor to select from
  useEffect(() => {
    async function fetchStudents() {
      const studentsCollection = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await getDocs(studentsCollection);
      const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);
    }
    fetchStudents();
  }, []);

  // Real-time listener for messages
  useEffect(() => {
    if (selectedStudent && user) {
      const unsubscribe = getMessages(user.uid, selectedStudent.user_id, (newMessages: any[]) => {
        setMessages(newMessages);
      });
      return () => unsubscribe(); // Cleanup on unmount
    }
  }, [selectedStudent, user]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send a message.");
      return;
    }

    if (selectedStudent && message.trim()) {
      try {
        await addDoc(collection(db, "messages"), {
          sender: user.uid, // Instructor as sender
          recipient: selectedStudent.user_id, // Student as recipient
          message,
          timestamp: serverTimestamp(),
        });
        setMessage(''); // Clear message input after sending
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    } else {
      alert("Please select a student and type a message.");
    }
  };

  // Scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-6">Message a Student</h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Student List for Instructor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="cursor-pointer" onClick={() => setSelectedStudent(student)}>
              <CardHeader>
                <CardTitle>{student.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{student.role}</span>
                <FiMessageCircle className="text-blue-500 text-xl" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat Window with Selected Student */}
        {selectedStudent && (
          <div className="mt-8 p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Send Message to {selectedStudent.name}</h2>
            <div className="h-64 overflow-y-auto mb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-2 my-2 ${msg.sender === user.uid ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <p>{msg.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* For auto-scrolling */ }
            </div>
            <textarea
              value={message}
              onChange={handleMessageChange}
              placeholder="Type your message here..."
              rows={4}
              className="w-full p-4 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleSendMessage} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg">
              Send Message
            </Button>
          </div>
        )}

        {/* No Student Selected */}
        {!selectedStudent && (
          <div className="text-center text-gray-600 mt-8">
            <p>Please select a student to send a message.</p>
          </div>
        )}
      </div>
    </div>
  );
}
