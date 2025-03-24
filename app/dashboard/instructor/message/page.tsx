"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { FiMessageCircle, FiSend, FiArrowLeft, FiEdit2, FiMoreVertical, FiSearch, FiChevronRight } from "react-icons/fi";
import {
  sendMessage,
  handleReaction,
  handleEditMessage,
  getMessages,
} from "@/lib/firestoreUtil";
import Link from "next/link";

export default function InstructorMessagePage() {
  const [user, setUser] = useState<any>(null); // Logged-in instructor
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReactions, setShowReactions] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Editing states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // 1. Fetch current user (instructor)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDocs(
          query(collection(db, "users"), where("user_id", "==", currentUser.uid))
        );
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          setUser({ ...currentUser, ...userData });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch students
  useEffect(() => {
    async function fetchStudents() {
      if (!user || !user.school_id) return;

      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("school_id", "==", user.school_id)
      );
      const snapshot = await getDocs(studentsQuery);
      const studentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsList);
    }
    fetchStudents();
  }, [user]);

  // 3. Real-time listener for messages
  useEffect(() => {
    if (selectedStudent && user) {
      const unsubscribe = getMessages(
        user.uid,
        selectedStudent.user_id,
        (newMessages: any[]) => {
          setMessages(newMessages);
        }
      );
      return () => unsubscribe();
    }
  }, [selectedStudent, user]);

  // 4. Send a message
  const handleSendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send a message.");
      return;
    }
    if (selectedStudent && message.trim()) {
      try {
        await sendMessage(user.uid, selectedStudent.user_id, message);
        setMessage("");
        // Focus back on the input after sending
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    } else {
      alert("Please select a student and type a message.");
    }
  };

  // 5. Handle reaction
  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!user || !selectedStudent) return;
    try {
      await handleReaction(user.uid, selectedStudent.user_id, messageId, emoji);
      setShowReactions(null);
    } catch (error) {
      console.error("Error updating reaction:", error);
      alert("Failed to update reaction.");
    }
  };

  // 6. Handle edit
  const handleEditMessageClick = async (messageId: string, newText: string) => {
    if (!user || !selectedStudent) return;
    try {
      await handleEditMessage(user.uid, selectedStudent.user_id, messageId, newText);
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message.");
    }
  };

  // 7. Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    (student.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: any[] } = {};
    
    messages.forEach(msg => {
      const date = msg.timestamp?.toDate ? 
        msg.timestamp.toDate().toLocaleDateString() : 
        new Date().toLocaleDateString();
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Scroll to bottom on messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Generate random avatar colors
  const getAvatarColors = (id: string) => {
    const colors = [
      'from-gray-700 to-gray-900',
      'from-gray-800 to-gray-950',
      'from-gray-600 to-gray-800',
      'from-gray-700 to-gray-800',
      'from-gray-800 to-gray-900'
    ];
    
    // Use the id to deterministically select a color
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="bg-black py-4 px-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-900">
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Message a Student
            </h1>
          </div>
          {user && (
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-medium shadow-lg">
                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "I"}
              </div>
              <span className="text-sm text-gray-300">{user.displayName || user.email}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Students List */}
        <div className="w-80 flex flex-col bg-black">
          <div className="p-4 bg-black sticky top-0 z-10">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-700 shadow-inner"
              />
            </div>
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Students
              </h2>
              <span className="text-xs px-2.5 py-1 bg-gray-900 text-gray-400 rounded-full">
                {filteredStudents.length}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                  <FiSearch className="h-6 w-6 text-gray-700" />
                </div>
                <p className="text-gray-400 font-medium">No students found</p>
                <p className="text-xs text-gray-600 mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`flex items-center p-3 my-1 space-x-3 cursor-pointer transition-all duration-200 rounded-xl ${
                    selectedStudent?.id === student.id
                      ? "bg-gray-900 shadow-lg"
                      : "hover:bg-gray-900/50"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium shadow-md bg-gradient-to-br ${getAvatarColors(student.id)}`}>
                      {student.name?.[0]?.toUpperCase() || student.email?.[0]?.toUpperCase() || "S"}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${
                      selectedStudent?.id === student.id ? "text-white" : "text-gray-300"
                    }`}>
                      {student.name || student.email}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        Math.random() > 0.5 ? "bg-gray-600" : "bg-gray-500"
                      }`}></div>
                      <p className="text-xs text-gray-500 truncate">
                        {student.email || "Student"}
                      </p>
                    </div>
                  </div>
                  {selectedStudent?.id === student.id && (
                    <FiChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-black to-gray-950">
          {selectedStudent ? (
            <>
              {/* Chat Header */}
              <div className="bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium text-xl shadow-md bg-gradient-to-br ${getAvatarColors(selectedStudent.id)}`}>
                    {selectedStudent.name?.[0]?.toUpperCase() || selectedStudent.email?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {selectedStudent.name || selectedStudent.email}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                      <span className="text-xs text-gray-400">
                        Last active recently
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-900/50 transition-colors">
                  <FiMoreVertical className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                      <FiMessageCircle className="h-12 w-12 text-gray-700" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-medium text-gray-300">No messages yet</p>
                      <p className="text-sm text-gray-500 mt-2 max-w-xs">
                        Start a conversation with {selectedStudent.name || selectedStudent.email} by sending a message below
                      </p>
                      <button 
                        onClick={() => messageInputRef.current?.focus()}
                        className="mt-4 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-full text-sm text-gray-300 transition-colors"
                      >
                        Start messaging
                      </button>
                    </div>
                  </div>
                ) : (
                  Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex-grow h-px bg-gray-800/50"></div>
                        <span className="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-900/50 rounded-full backdrop-blur-sm">
                          {new Date(date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <div className="flex-grow h-px bg-gray-800/50"></div>
                      </div>
                      
                      {msgs.map((msg: any) => {
                        const isSender = msg.sender === user.uid;
                        return (
                          <div
                            key={msg.messageId}
                            className={`flex items-end ${
                              isSender ? "justify-end" : "justify-start"
                            } group`}
                          >
                            {/* Avatar on the left if NOT sender */}
                            {!isSender && (
                              <div className="mr-2 flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm shadow-sm bg-gradient-to-br ${getAvatarColors(selectedStudent.id)}`}>
                                  {selectedStudent.name?.[0]?.toUpperCase() || selectedStudent.email?.[0]?.toUpperCase() || "S"}
                                </div>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`relative max-w-sm p-4 ${
                                isSender
                                  ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl rounded-tr-sm"
                                  : "bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl rounded-tl-sm"
                              } shadow-lg hover:shadow-xl transition-shadow`}
                            >
                              {editingMessageId === msg.messageId ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full p-2 focus:outline-none focus:ring-1 focus:ring-white bg-gray-800 text-white rounded-lg"
                                    style={{ minHeight: "60px" }}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={async () => {
                                        await handleEditMessageClick(msg.messageId, editingText);
                                        setEditingMessageId(null);
                                      }}
                                      className="px-3 py-1.5 text-xs bg-white text-black hover:bg-gray-200 transition-colors rounded-full"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingMessageId(null)}
                                      className="px-3 py-1.5 text-xs bg-gray-800 text-white hover:bg-gray-700 transition-colors rounded-full"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="break-words">
                                    {msg.message}
                                    {msg.edited && (
                                      <span className="ml-2 text-xs text-gray-500 italic">
                                        (edited)
                                      </span>
                                    )}
                                  </p>
                                  <div className="mt-1 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {msg.timestamp?.toDate ? 
                                        msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                                        "Just now"}
                                    </span>
                                    {isSender && (
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(msg.messageId);
                                          setEditingText(msg.message);
                                        }}
                                        className="text-xs text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center space-x-1"
                                      >
                                        <FiEdit2 className="h-3 w-3" />
                                        <span>Edit</span>
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}

                              {/* Reaction UI */}
                              <div className="mt-2 flex items-center gap-2">
                                {showReactions === msg.messageId ? (
                                  <div className="flex items-center gap-1 bg-gray-800/80 backdrop-blur-sm p-1 rounded-full shadow-lg animate-fadeIn">
                                    <button
                                      onClick={() => handleReactionClick(msg.messageId, "👍")}
                                      className="text-sm hover:bg-gray-700 p-1.5 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                      👍
                                    </button>
                                    <button
                                      onClick={() => handleReactionClick(msg.messageId, "❤️")}
                                      className="text-sm hover:bg-gray-700 p-1.5 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                      ❤️
                                    </button>
                                    <button
                                      onClick={() => handleReactionClick(msg.messageId, "😆")}
                                      className="text-sm hover:bg-gray-700 p-1.5 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                      😆
                                    </button>
                                    <button
                                      onClick={() => handleReactionClick(msg.messageId, "👏")}
                                      className="text-sm hover:bg-gray-700 p-1.5 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                      👏
                                    </button>
                                    <button
                                      onClick={() => handleReactionClick(msg.messageId, "🔥")}
                                      className="text-sm hover:bg-gray-700 p-1.5 rounded-full transform hover:scale-110 transition-transform"
                                    >
                                      🔥
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowReactions(msg.messageId)}
                                    className="text-xs text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 bg-gray-800/50 hover:bg-gray-800 px-2 py-1 rounded-full"
                                  >
                                    Add reaction
                                  </button>
                                )}
                                
                                {Object.entries(msg.reactions || {}).length > 0 && (
                                  <div className="flex items-center bg-gray-800/50 backdrop-blur-sm px-2 py-1 rounded-full">
                                    {Object.entries(msg.reactions || {}).map(([uid, emoji]) => (
                                      <span key={uid} className="text-sm mx-0.5 hover:transform hover:scale-110 transition-transform">
                                        {emoji as string}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Avatar on the right if sender */}
                            {isSender && (
                              <div className="ml-2 flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-sm shadow-sm">
                                  {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "I"}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4">
                <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                  <textarea
                    ref={messageInputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message here..."
                    rows={2}
                    className="w-full p-4 pr-12 resize-none bg-transparent focus:outline-none focus:ring-0 placeholder-gray-500 text-white"
                  />
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Press Enter to send, Shift+Enter for a new line
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className={`p-2 rounded-full transition-all ${
                        message.trim() 
                          ? "bg-white hover:bg-gray-200 text-black shadow-md hover:shadow-lg" 
                          : "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // If no student is selected
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="max-w-md text-center space-y-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto shadow-xl">
                  <FiMessageCircle className="h-14 w-14 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Select a student
                  </h3>
                  <p className="text-gray-500 max-w-xs mx-auto">
                    Choose a student from the list to view messages and start a conversation
                  </p>
                </div>
                <div className="pt-4">
                  <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm text-gray-300 bg-gray-900/70 backdrop-blur-sm hover:bg-gray-800 transition-all cursor-pointer shadow-md hover:shadow-lg">
                    <FiSearch className="mr-2 h-4 w-4" />
                    Browse students
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}