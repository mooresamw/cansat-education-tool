"use client";

import { useEffect, useState, useRef } from 'react';
import { auth, db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiMessageCircle } from "react-icons/fi";
import { sendMessage, getMessages, handleReaction, handleEditMessage } from "@/lib/firestoreUtil";

export default function StudentChatPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Fetch the currently authenticated user (student) and their data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDocs(query(collection(db, 'users'), where('user_id', '==', currentUser.uid)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          setUser({ ...currentUser, ...userData }); // Merge auth user with Firestore data
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch students from the same school, excluding the current user
  useEffect(() => {
    async function fetchStudents() {
      if (!user || !user.school_id) return;

      // Query students with the same school_id and role 'student'
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('school_id', '==', user.school_id) // Filter by school_id
      );
      const snapshot = await getDocs(studentsQuery);
      const studentsList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(student => student.id !== user.uid); // Exclude current user
      setStudents(studentsList);
    }
    fetchStudents();
  }, [user]);

  // Real-time listener for messages
  useEffect(() => {
    if (selectedStudent && user) {
      const unsubscribe = getMessages(user.uid, selectedStudent.id, (newMessages: any[]) => {
        setMessages(newMessages);
      });
      return () => unsubscribe();
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
      // Additional safety check (optional, since student list is already filtered)
      if (selectedStudent.school_id !== user.school_id) {
        alert("You can only message students from your school.");
        return;
      }
      try {
        await sendMessage(user.uid, selectedStudent.id, message);
        setMessage('');
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    } else {
      alert("Please select a student and type a message.");
    }
  };

  // Reaction handler
  const handleReactionWrapper = async (messageId: string, emoji: string) => {
    if (!user) {
      alert("You must be logged in to react to a message.");
      return;
    }
    try {
      await handleReaction(user.uid, selectedStudent.id, messageId, emoji);
    } catch (error) {
      console.error("Error updating reaction:", error);
      alert("Failed to update reaction.");
    }
  };

  // Edit message handler
  const handleEditMessageWrapper = async (messageId: string, newText: string) => {
    try {
      await handleEditMessage(user.uid, selectedStudent.id, messageId, newText);
      setEditingMessageId(null);
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message.");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.length > 0 ? (
            students.map((student) => (
              <Card key={student.id} className="cursor-pointer" onClick={() => setSelectedStudent(student)}>
                <CardHeader>
                  <CardTitle>{student.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{student.role}</span>
                  <FiMessageCircle className="text-blue-500 text-xl" />
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-600">No students from your school available to message.</p>
          )}
        </div>

        {selectedStudent && (
          <div className="mt-8 p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Send Message to {selectedStudent.name}</h2>
            <div className="h-64 overflow-y-auto mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`p-2 my-2 ${msg.sender === user.uid ? 'bg-blue-100' : 'bg-gray-100'}`}
                >
                  {editingMessageId === msg.messageId ? (
                    <div>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditMessageWrapper(msg.messageId, editingText)}
                          className="bg-green-500 text-white py-1 px-3 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="bg-red-500 text-white py-1 px-3 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p>
                        {msg.message} {msg.edited && <span className="italic text-sm">(edited)</span>}
                      </p>
                      {msg.sender === user.uid && (
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.messageId);
                            setEditingText(msg.message);
                          }}
                          className="mt-2 text-blue-600 underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {['❤️', '👎', '👍'].map((emoji) => {
                      const count = Object.values(msg.reactions || {}).filter((r) => r === emoji).length;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReactionWrapper(msg.messageId, emoji)}
                          className="text-lg hover:scale-125 transition-transform"
                        >
                          {emoji} {count}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
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

        {!selectedStudent && (
          <div className="text-center text-gray-600 mt-8">
            <p>Please select a student to send a message.</p>
          </div>
        )}
      </div>
    </div>
  );
}