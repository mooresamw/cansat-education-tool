"use client";

import { useEffect, useState, useRef } from 'react';
import { auth, db } from "@/lib/firebaseConfig";
import { collection, runTransaction, getDocs, query,
 where, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
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
          reactions: {},
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

  // Handle adding a reaction to a message
const handleReaction = async (messageId: string, emoji: string): Promise<void> => {
  if (!user) {
    alert("You must be logged in to react to a message.");
    return;
  }
  const messageRef = doc(db, 'messages', messageId);
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
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { message: newText, edited: true});
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
    {editingMessageId === msg.id ? (
      <div>
        <textarea
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg mb-2"
        />
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await handleEditMessage(msg.id, editingText);
              setEditingMessageId(null);
            }}
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
              setEditingMessageId(msg.id);
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
            onClick={() => handleReaction(msg.id, emoji)}
            className="text-lg hover:scale-125 transition-transform"
          >
            {emoji} {count}
          </button>
        );
      })}
    </div>
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
