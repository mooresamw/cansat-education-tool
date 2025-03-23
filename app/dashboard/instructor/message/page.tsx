"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import {
  sendMessage,
  handleReaction,
  handleEditMessage,
  getMessages,
} from "@/lib/firestoreUtil";

export default function InstructorMessagePage() {
  const [user, setUser] = useState<any>(null); // Logged-in instructor
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('school_id', '==', user.school_id) // Filter by school_id
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
      // Optional safety check (redundant since list is filtered)
      if (selectedStudent.school_id !== user.school_id) {
        alert("You can only message students from your school.");
        return;
      }
      try {
        await sendMessage(user.uid, selectedStudent.user_id, message);
        setMessage('');
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    } else {
      alert("Please select a student and type a message.");
    }
  };

  // Handle adding a reaction to a message
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

  const handleEditMessage = async (messageId: string, newText: string): Promise<void> => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, { message: newText, edited: true });
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message.");
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
        <h1 className="text-2xl font-bold">Message a Student</h1>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Student List for Instructor */}
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

        {/* Chat Window with Selected Student */}
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
