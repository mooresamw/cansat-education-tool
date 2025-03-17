"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  collection,
  runTransaction,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiArrowUp, FiMessageCircle, FiSend } from "react-icons/fi";
import { getMessages } from "@/lib/firestoreUtil"; // Assuming this is your utility file

export default function InstructorMessagePage() {
  const [user, setUser] = useState<any>(null); // Store logged-in instructor
  const [students, setStudents] = useState<any[]>([]); // Store list of students
  const [selectedStudent, setSelectedStudent] = useState<any>(null); // The student being messaged
  const [message, setMessage] = useState(""); // Current message input
  const [messages, setMessages] = useState<any[]>([]); // Store conversation history
  const messagesEndRef = useRef<HTMLDivElement>(null); // Auto-scroll reference
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
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
      const studentsCollection = query(
        collection(db, "users"),
        where("role", "==", "student")
      );
      const snapshot = await getDocs(studentsCollection);
      const studentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsList);
    }
    fetchStudents();
  }, []);

  // Real-time listener for messages
  useEffect(() => {
    if (selectedStudent && user) {
      const unsubscribe = getMessages(
        user.uid,
        selectedStudent.user_id,
        (newMessages: any[]) => {
          setMessages(newMessages);
        }
      );
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
          reactions: {},
        });
        setMessage(""); // Clear message input after sending
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    } else {
      alert("Please select a student and type a message.");
    }
  };

  // Handle adding a reaction to a message
  const handleReaction = async (
    messageId: string,
    emoji: string
  ): Promise<void> => {
    if (!user) {
      alert("You must be logged in to react to a message.");
      return;
    }
    const messageRef = doc(db, "messages", messageId);
    try {
      await runTransaction(db, async (transaction) => {
        const messageDoc = await transaction.get(messageRef);
        if (!messageDoc.exists()) {
          throw "Message does not exist!";
        }
        let reactions = messageDoc.data().reactions || {};

        // Toggle off if same emoji is clicked; otherwise, update to the new emoji.
        if (reactions[user.uid] === emoji) {
          delete reactions[user.uid];
        } else {
          reactions[user.uid] = emoji;
        }
        transaction.update(messageRef, { reactions });
      });
    } catch (error) {
      console.error("Error updating reaction:", error);
      alert("Failed to update reaction.");
    }
  };

  const handleEditMessage = async (
    messageId: string,
    newText: string
  ): Promise<void> => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, { message: newText, edited: true });
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

  ("use client");

  // ... (keep all the existing imports and logic)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Message a Student</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Student List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Students
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`flex items-center p-4 space-x-3 cursor-pointer transition-colors ${
                  selectedStudent?.id === student.id
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "hover:bg-gray-50 border-l-4 border-transparent"
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {student.name[0]}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {student.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {student.email || "Student"}
                  </p>
                </div>
                <FiMessageCircle className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedStudent ? (
            <>
              <div className="bg-white p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xl">
                    {selectedStudent.name[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-sm text-gray-500">Active now</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                    <FiMessageCircle className="h-12 w-12" />
                    <p className="text-lg">No messages yet</p>
                    <p className="text-sm">
                      Start a conversation with {selectedStudent.name}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === user.uid
                          ? "justify-end"
                          : "justify-start"
                      } space-x-2`}
                    >
                      {msg.sender !== user.uid && (
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                            {selectedStudent.name[0]}
                          </div>
                        </div>
                      )}

                      <div
                        className={`max-w-xl p-4 rounded-2xl ${
                          msg.sender === user.uid
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-900 shadow-sm"
                        }`}
                      >
                        {/* Message editing UI (keep existing logic) */}
                        {editingMessageId === msg.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full p-2 bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-900"
                              style={{ minHeight: "60px" }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  await handleEditMessage(msg.id, editingText);
                                  setEditingMessageId(null);
                                }}
                                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="break-words">
                              {msg.message}
                              {msg.edited && (
                                <span className="ml-2 text-xs text-gray-400 italic">
                                  (edited)
                                </span>
                              )}
                            </p>
                            {msg.sender === user.uid && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditingText(msg.message);
                                }}
                                className="mt-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}

                        {/* Reactions */}
                        <div className="mt-2 flex items-center space-x-2">
                          {Object.entries(msg.reactions || {}).map(
                            ([uid, emoji]: any) => (
                              <span
                                key={uid}
                                className={`text-sm p-1 rounded-full ${
                                  msg.sender === user.uid
                                    ? "bg-blue-600/20"
                                    : "bg-gray-100"
                                }`}
                              >
                                {emoji}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {msg.sender === user.uid && (
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                            {user.displayName?.[0] || "Y"}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Type your message here..."
                    rows={2}
                    className="w-full p-3 pr-16 resize-none border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="absolute bottom-3 right-3 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm transition-colors"
                  >
                    <FiSend className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <div className="max-w-md text-center space-y-4">
                <FiMessageCircle className="h-16 w-16 text-gray-300 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Select a student
                </h3>
                <p className="text-gray-500">
                  Choose a student from the list to view messages and start a
                  conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
