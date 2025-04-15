"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import {
  sendMessage,
  handleReaction,
  handleEditMessage,
  getMessages,
  markMessageAsRead,
} from "@/lib/firestoreUtil";
import { DashboardLayout } from "@/components/DashboardLayout";
import Loading from "@/components/Loading";

export default function StudentMessagePage() {
  const [user, setUser] = useState<any>(null);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(true);

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
          setLoading(false);
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

  // 3. Real-time listener for messages with mark-as-read logic
  useEffect(() => {
    if (!selectedChat || !user) return;
    console.log(selectedChat.id);
    const chatId = isGroupChat
      ? selectedChat.id
      : [user.uid, selectedChat.id].sort().join("_");
    console.log(chatId);
    const unsubscribe = getMessages(chatId, (newMessages: any[]) => {
      setMessages(newMessages);
      newMessages.forEach((msg) => {
        if (msg.sender !== user.uid && !msg.read?.[user.uid]) {
          markMessageAsRead(chatId, user.uid, msg.messageId);
        }
      });
    });
    return () => unsubscribe();
  }, [selectedChat, user, isGroupChat]);

  // Send a message
  const handleSendMessage = async () => {
    if (!user || !message.trim() || !selectedChat) {
      alert("You must be logged in and select a chat to send a message.");
      return;
    }

    const chatId = isGroupChat
      ? selectedChat.id
      : [user.uid, selectedChat.id].sort().join("_");
    const participants = isGroupChat
      ? selectedChat.members.map((m: any) => (typeof m === "string" ? m : m.user_id))
      : [user.uid, selectedChat.id];

    try {
      await sendMessage(chatId, user.uid, message, participants);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  // Reaction handler
  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!user || !selectedChat) return;

    const chatId = isGroupChat
      ? selectedChat.id
      : [user.uid, selectedChat.id].sort().join("_");

    try {
      await handleReaction(chatId, user.uid, messageId, emoji);
    } catch (error) {
      console.error("Error updating reaction:", error);
      alert("Failed to update reaction.");
    }
  };

  // Edit message handler
  const handleEditMessageClick = async (messageId: string, newText: string) => {
    if (!user || !selectedChat) return;

    const chatId = isGroupChat
      ? selectedChat.id
      : [user.uid, selectedChat.id].sort().join("_");

    try {
      await handleEditMessage(chatId, user.uid, messageId, newText);
      setEditingMessageId(null);
      setEditingText("");
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message.");
    }
  };

  // Scroll to bottom on messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: any) => {
    return timestamp
      ? new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Just now";
  };

  // Helper function to format date for separators
  const formatDateSeparator = (timestamp: any) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <Loading />;
  return (
    <DashboardLayout userType={user?.role || "student"}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-card text-primary shadow-md py-4 px-6">
          <h1 className="text-2xl font-bold">
            Message an Instructor From {user?.school_name?.split(",")[0]}
          </h1>
        </header>

        <div className="flex flex-1 overflow-hidden bg-card">
          {/* Sidebar: Instructors List */}
          <div className="w-80 border-r border-border flex flex-col">
            <div className="p-4 bg-card shadow-sm">
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
                Instructors
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-card">
              {instructors.map((instructor) => (
                <div
                  key={instructor.id}
                  onClick={() => setSelectedChat(instructor)}
                  className={`flex bg-card items-center p-4 space-x-3 cursor-pointer transition-colors duration-150 ${
                    selectedChat?.id === instructor.id
                      ? "bg-accent border-l-4 border-blue-500"
                      : "hover:bg-accent border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {instructor.name?.[0]?.toUpperCase() || "I"}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-primary truncate">
                      {instructor.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {instructor.email || "Instructor"}
                    </p>
                  </div>
                  <FiMessageCircle className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="bg-card p-4 shadow-sm flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xl">
                    {selectedChat.name?.[0]?.toUpperCase() || "I"}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-primary">
                      {selectedChat.name}
                    </h2>
                    <span className="">
                    </span>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                      <FiMessageCircle className="h-12 w-12" />
                      <p className="text-lg">No messages yet</p>
                      <p className="text-sm">
                        Start a conversation with {selectedChat.name}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isSender = msg.sender === user.uid;
                      const timestamp = formatTimestamp(msg.timestamp);

                      // Check if we need a date separator
                      const currentDate = msg.timestamp ? new Date(msg.timestamp).toDateString() : "";
                      const prevDate =
                        index > 0 && messages[index - 1].timestamp
                          ? new Date(messages[index - 1].timestamp).toDateString()
                          : null;
                      const showDateSeparator = index === 0 || currentDate !== prevDate;

                      return (
                        <div key={msg.messageId} className="space-y-2">
                          {showDateSeparator && (
                            <div className="text-center my-2">
                              <span className="inline-block bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                                {formatDateSeparator(msg.timestamp)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex items-end ${
                              isSender ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isSender && (
                              <div className="mr-2 flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                                  {selectedChat.name?.[0]?.toUpperCase() || "I"}
                                </div>
                              </div>
                            )}

                            <div
                              className={`relative max-w-sm p-4 rounded-3xl shadow-lg transition-all duration-200 ${
                                isSender
                                  ? "bg-blue-500 text-white rounded-br-sm"
                                  : "bg-white text-gray-900 rounded-bl-sm"
                              }`}
                            >
                              {editingMessageId === msg.messageId ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-black bg-gray-50"
                                    style={{ minHeight: "60px" }}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleEditMessageClick(msg.messageId, editingText)}
                                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                                <>
                                  <p className="break-words">
                                    {msg.message}
                                    {msg.edited && (
                                      <span className="ml-2 text-xs text-gray-300 italic">
                                        (edited)
                                      </span>
                                    )}
                                  </p>
                                  <div
                                    className={`text-xs mt-1 ${
                                      isSender ? "text-blue-200" : "text-gray-500"
                                    }`}
                                  >
                                    {timestamp}
                                  </div>
                                  {isSender && (
                                    <button
                                      onClick={() => {
                                        setEditingMessageId(msg.messageId);
                                        setEditingText(msg.message);
                                      }}
                                      className="mt-1 text-xs text-blue-200 hover:text-blue-100 transition-colors"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </>
                              )}

                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleReactionClick(msg.messageId, "👍")}
                                  className="text-sm text-gray-600 hover:text-gray-900 transform hover:scale-105 transition-transform"
                                >
                                  👍
                                </button>
                                <button
                                  onClick={() => handleReactionClick(msg.messageId, "❤️")}
                                  className="text-sm text-gray-600 hover:text-gray-900 transform hover:scale-105 transition-transform"
                                >
                                  ❤️
                                </button>
                                <button
                                  onClick={() => handleReactionClick(msg.messageId, "😆")}
                                  className="text-sm text-gray-600 hover:text-gray-900 transform hover:scale-105 transition-transform"
                                >
                                  😆
                                </button>
                                {Object.entries(msg.reactions || {}).map(([uid, emoji]) => (
                                  <span
                                    key={uid}
                                    className={`text-sm px-1 rounded-full ${
                                      isSender ? "bg-blue-600/20" : "bg-gray-200"
                                    }`}
                                  >
                                    {emoji as string}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {isSender && (
                              <div className="ml-2 flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm">
                                  {user.name?.[0] || "Y"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-card border-t border-border p-4">
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={2}
                      className="w-full p-3 pr-16 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="absolute bottom-6 right-3 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm transition-colors"
                    >
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // If no instructor is selected
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="max-w-md text-center space-y-4">
                  <FiMessageCircle className="h-16 w-16 text-gray-300 mx-auto" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Select an instructor
                  </h3>
                  <p className="text-gray-500">
                    Choose an instructor from the list to view messages and start a conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}