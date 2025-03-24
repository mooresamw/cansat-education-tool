"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { FiMessageCircle, FiSend, FiArrowLeft, FiEdit2, FiMoreVertical, FiSearch } from "react-icons/fi";
import {
  sendMessage,
  handleReaction,
  handleEditMessage,
  getMessages,
} from "@/lib/firestoreUtil";
import Link from "next/link";

export default function StudentMessagePage() {
  const [user, setUser] = useState<any>(null);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Editing states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // 1. Fetch current user (student)
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

  // 2. Fetch instructors
  useEffect(() => {
    async function fetchInstructors() {
      if (!user || !user.school_id) return;

      const instructorsQuery = query(
        collection(db, "users"),
        where("role", "==", "instructor"),
        where("school_id", "==", user.school_id)
      );
      const snapshot = await getDocs(instructorsQuery);
      const instructorsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInstructors(instructorsList);
    }
    fetchInstructors();
  }, [user]);

  // 3. Real-time listener for messages
  useEffect(() => {
    if (selectedInstructor && user) {
      const unsubscribe = getMessages(
        user.uid,
        selectedInstructor.user_id,
        (newMessages: any[]) => {
          setMessages(newMessages);
        }
      );
      return () => unsubscribe();
    }
  }, [selectedInstructor, user]);

  // 4. Send a message
  const handleSendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send a message.");
      return;
    }
    if (selectedInstructor && message.trim()) {
      // Optional: check same school
      if (selectedInstructor.school_id !== user.school_id) {
        alert("You can only send messages to instructors in your school.");
        return;
      }
      try {
        await sendMessage(user.uid, selectedInstructor.user_id, message);
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
      alert("Please select an instructor and type a message.");
    }
  };

  // 5. Handle reaction
  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!user || !selectedInstructor) return;
    try {
      await handleReaction(user.uid, selectedInstructor.user_id, messageId, emoji);
    } catch (error) {
      console.error("Error updating reaction:", error);
      alert("Failed to update reaction.");
    }
  };

  // 6. Handle edit
  const handleEditMessageClick = async (messageId: string, newText: string) => {
    if (!user || !selectedInstructor) return;
    try {
      await handleEditMessage(user.uid, selectedInstructor.user_id, messageId, newText);
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

  // Filter instructors based on search term
  const filteredInstructors = instructors.filter(instructor => 
    (instructor.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (instructor.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
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

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 py-4 px-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-900">
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-medium">Message an Instructor</h1>
          </div>
          {user && (
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-medium border border-gray-700 shadow-lg">
                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "S"}
              </div>
              <span className="text-sm text-gray-300">{user.displayName || user.email}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Instructors List */}
        <div className="w-80 border-r border-gray-800 flex flex-col bg-black">
          <div className="p-4 bg-black border-b border-gray-800 sticky top-0 z-10">
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-gray-600"
              />
            </div>
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Instructors
              </h2>
              <span className="text-xs px-2 py-1 bg-gray-900 text-gray-400 rounded-full">
                {filteredInstructors.length}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredInstructors.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                  <FiSearch className="h-6 w-6 text-gray-700" />
                </div>
                <p className="text-gray-400 font-medium">No instructors found</p>
                <p className="text-xs text-gray-600 mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredInstructors.map((instructor) => (
                <div
                  key={instructor.id}
                  onClick={() => setSelectedInstructor(instructor)}
                  className={`flex items-center p-4 space-x-3 cursor-pointer transition-all duration-200 ${
                    selectedInstructor?.id === instructor.id
                      ? "bg-gray-900 border-l-2 border-white"
                      : "hover:bg-gray-900 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium shadow-md ${
                      selectedInstructor?.id === instructor.id 
                        ? "bg-gradient-to-br from-gray-600 to-gray-800 border border-gray-600" 
                        : "bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-700"
                    }`}>
                      {instructor.name?.[0]?.toUpperCase() || instructor.email?.[0]?.toUpperCase() || "I"}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${
                      selectedInstructor?.id === instructor.id ? "text-white" : "text-gray-300"
                    }`}>
                      {instructor.name || instructor.email}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        Math.random() > 0.5 ? "bg-gray-600" : "bg-gray-500"
                      }`}></div>
                      <p className="text-xs text-gray-500 truncate">
                        {instructor.email || "Instructor"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedInstructor ? (
            <>
              {/* Chat Header */}
              <div className="bg-black p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-medium text-xl border border-gray-700 shadow-md">
                    {selectedInstructor.name?.[0]?.toUpperCase() || selectedInstructor.email?.[0]?.toUpperCase() || "I"}
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {selectedInstructor.name || selectedInstructor.email}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                      <span className="text-xs text-gray-400">
                        Last active recently
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-900 transition-colors">
                  <FiMoreVertical className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                      <FiMessageCircle className="h-10 w-10 text-gray-700" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-medium text-gray-300">No messages yet</p>
                      <p className="text-sm text-gray-500 mt-2 max-w-xs">
                        Start a conversation with {selectedInstructor.name || selectedInstructor.email} by sending a message below
                      </p>
                    </div>
                  </div>
                ) : (
                  Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex-grow h-px bg-gray-800"></div>
                        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-900 rounded-full">
                          {new Date(date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <div className="flex-grow h-px bg-gray-800"></div>
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
                              <div className="mr-2 flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-sm border border-gray-700 shadow-sm">
                                  {selectedInstructor.name?.[0]?.toUpperCase() || selectedInstructor.email?.[0]?.toUpperCase() || "I"}
                                </div>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`relative max-w-sm p-4 ${
                                isSender
                                  ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-tl-lg rounded-bl-lg rounded-tr-sm"
                                  : "bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-tr-lg rounded-br-lg rounded-tl-sm"
                              } shadow-md`}
                            >
                              {editingMessageId === msg.messageId ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full p-2 focus:outline-none focus:ring-1 focus:ring-white bg-gray-800 text-white border border-gray-700 rounded-md"
                                    style={{ minHeight: "60px" }}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={async () => {
                                        await handleEditMessageClick(msg.messageId, editingText);
                                        setEditingMessageId(null);
                                      }}
                                      className="px-3 py-1.5 text-xs bg-white text-black hover:bg-gray-200 transition-colors rounded-md"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingMessageId(null)}
                                      className="px-3 py-1.5 text-xs bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition-colors rounded-md"
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
                                <div className="flex -space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleReactionClick(msg.messageId, "👍")}
                                    className="text-sm bg-gray-800 hover:bg-gray-700 p-1 rounded-full border border-gray-700 transform hover:scale-110 transition-transform"
                                  >
                                    👍
                                  </button>
                                  <button
                                    onClick={() => handleReactionClick(msg.messageId, "❤️")}
                                    className="text-sm bg-gray-800 hover:bg-gray-700 p-1 rounded-full border border-gray-700 transform hover:scale-110 transition-transform"
                                  >
                                    ❤️
                                  </button>
                                  <button
                                    onClick={() => handleReactionClick(msg.messageId, "😆")}
                                    className="text-sm bg-gray-800 hover:bg-gray-700 p-1 rounded-full border border-gray-700 transform hover:scale-110 transition-transform"
                                  >
                                    😆
                                  </button>
                                </div>
                                {Object.entries(msg.reactions || {}).length > 0 && (
                                  <div className="flex items-center bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
                                    {Object.entries(msg.reactions || {}).map(([uid, emoji]) => (
                                      <span key={uid} className="text-sm mx-0.5">
                                        {emoji as string}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Avatar on the right if sender */}
                            {isSender && (
                              <div className="ml-2 flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-sm border border-gray-700 shadow-sm">
                                  {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "S"}
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
              <div className="bg-black border-t border-gray-800 p-4">
                <div className="bg-gray-900 rounded-lg shadow-inner overflow-hidden">
                  <textarea
                    ref={messageInputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message here..."
                    rows={2}
                    className="w-full p-4 pr-12 resize-none bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-500 text-white"
                  />
                  <div className="px-4 py-2 flex items-center justify-between border-t border-gray-800">
                    <div className="text-xs text-gray-500">
                      Press Enter to send, Shift+Enter for a new line
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className={`p-2 rounded-full transition-colors ${
                        message.trim() 
                          ? "bg-white hover:bg-gray-200 text-black" 
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // If no instructor is selected
            <div className="flex-1 flex flex-col items-center justify-center bg-black">
              <div className="max-w-md text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto shadow-xl border border-gray-700">
                  <FiMessageCircle className="h-12 w-12 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-white mb-2">
                    Select an instructor
                  </h3>
                  <p className="text-gray-500 max-w-xs mx-auto">
                    Choose an instructor from the list to view messages and start a conversation
                  </p>
                </div>
                <div className="pt-4">
                  <div className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md text-sm text-gray-400 bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer">
                    <FiSearch className="mr-2 h-4 w-4" />
                    Browse instructors
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