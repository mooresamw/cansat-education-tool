"use client"


import { useEffect, useState, useRef } from 'react';
import { auth, db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiMessageCircle } from "react-icons/fi";
import { getMessages } from "@/lib/firestoreUtil"; // Assuming this is your utility file

export default function MessagePage() {
  const [user, setUser] = useState<any>(null); // Store logged-in user
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null); // For auto-scrolling to the bottom

  // Fetch the currently authenticated user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Fetch instructors
  useEffect(() => {
    async function fetchInstructors() {
      const instructorsCollection = query(collection(db, 'users'), where('role', '==', 'instructor'));
      const snapshot = await getDocs(instructorsCollection);
      const instructorsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInstructors(instructorsList);
    }
    fetchInstructors();
  }, []);

  // Real-time listener for messages
  useEffect(() => {
    if (selectedInstructor && user) {
      const unsubscribe = getMessages(user.uid, selectedInstructor.user_id, (newMessages: any[]) => {
        setMessages(newMessages);
      });
      return () => unsubscribe(); // Cleanup on unmount
    }
  }, [selectedInstructor, user]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send a message.");
      return;
    }

    if (selectedInstructor && message.trim()) {
      try {
        await addDoc(collection(db, "messages"), {
          sender: user.uid,
          recipient: selectedInstructor.user_id,
          message,
          timestamp: serverTimestamp(),
        });
        setMessage(''); // Clear message input after sending
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    } else {
      alert("Please select an instructor and type a message.");
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
      <h1 className="text-2xl font-bold text-center mb-6">Message an Instructor</h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Instructor List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors.map((instructor) => (
            <Card key={instructor.id} className="cursor-pointer" onClick={() => setSelectedInstructor(instructor)}>
              <CardHeader>
                <CardTitle>{instructor.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{instructor.role}</span>
                <FiMessageCircle className="text-blue-500 text-xl" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat Window */}
        {selectedInstructor && (
          <div className="mt-8 p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Send Message to {selectedInstructor.name}</h2>
            <div className="h-64 overflow-y-auto mb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-2 my-2 ${msg.sender === user.uid ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <p>{msg.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* For auto-scrolling */}
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

        {/* No Instructor Selected */}
        {!selectedInstructor && (
          <div className="text-center text-gray-600 mt-8">
            <p>Please select an instructor to send a message.</p>
          </div>
        )}
      </div>
    </div>
  );
}
