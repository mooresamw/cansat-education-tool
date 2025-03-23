"use client";

import { useEffect, useState, useRef } from 'react';
import { auth, db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiMessageCircle } from "react-icons/fi";
import { sendMessage, getMessages, handleReaction, handleEditMessage } from "@/lib/firestoreUtil";

export default function StudentMessagePage() {
  const [user, setUser] = useState<any>(null);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Editing states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Fetch the currently authenticated user and their data
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

  // Fetch instructors from the same school
  useEffect(() => {
    async function fetchInstructors() {
      if (!user || !user.school_id) return;

      const instructorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'instructor'),
        where('school_id', '==', user.school_id) // Filter by school_id
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

  // Real-time listener for messages
  useEffect(() => {
    if (selectedInstructor && user) {
      const unsubscribe = getMessages(user.uid, selectedInstructor.user_id, (newMessages: any[]) => {
        setMessages(newMessages);
      });
      return () => unsubscribe();
    }
  }, [selectedInstructor, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 4. Send a message
  const handleSendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send a message.");
      return;
    }
    if (selectedInstructor && message.trim()) {
      // Optional safety check (redundant since list is filtered)
      if (selectedInstructor.school_id !== user.school_id) {
        alert("You can only message instructors from your school.");
        return;
      }
      try {
        await sendMessage(user.uid, selectedInstructor.user_id, message);
        setMessage('');
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    } else {
      alert("Please select an instructor and type a message.");
    }
  };

  // Reaction handler
  const handleReactionWrapper = async (messageId: string, emoji: string) => {
    if (!user) {
      alert("You must be logged in to react to a message.");
      return;
    }
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

  // Edit message handler
  const handleEditMessageWrapper = async (messageId: string, newText: string) => {
    try {
      await handleEditMessage(user.uid, selectedInstructor.user_id, messageId, newText);
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md py-4 px-6">
        <h1 className="text-2xl font-bold">Message an Instructor</h1>
      </header>

      <div className="flex flex-1 overflow-hidden bg-gray-50">
        {/* Sidebar: Instructors List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 bg-white shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Instructors
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                onClick={() => setSelectedInstructor(instructor)}
                className={`flex items-center p-4 space-x-3 cursor-pointer transition-colors duration-150 ${
                  selectedInstructor?.id === instructor.id
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "hover:bg-gray-100 border-l-4 border-transparent"
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {instructor.name?.[0]?.toUpperCase() || "I"}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
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

        {/* Chat Window */}
        {selectedInstructor && (
          <div className="mt-8 p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Send Message to {selectedInstructor.name}</h2>
            <div className="h-64 overflow-y-auto mb-4">
              {messages.map((msg) => (
                <div key={msg.messageId} className={`p-2 my-2 ${msg.sender === user.uid ? 'bg-blue-100' : 'bg-gray-100'}`}>
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
