import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot, Timestamp } from "firebase/firestore";

/**
 * Send a message to Firestore
 * @param senderId - ID of the sender (student)
 * @param recipientId - ID of the recipient (instructor)
 * @param messageText - The message text
 */
export const sendMessage = async (senderId: string, recipientId: string, messageText: string) => {
  try {
    await addDoc(collection(db, "messages"), {
      sender: senderId,
      recipient: recipientId,
      message: messageText,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

/**
 * Get messages between two users (student & instructor)
 * @param studentId - ID of the student
 * @param instructorId - ID of the instructor
 * @param callback - Function to handle real-time message updates
 */
export const getMessages = (studentId: string, instructorId: string, callback: (messages: any[]) => void) => {
  const q = query(
    collection(db, "messages"),
    where("sender", "in", [studentId, instructorId]),
    where("recipient", "in", [studentId, instructorId]),
    orderBy("timestamp", "asc")
  );

  // Real-time listener for messages
  return onSnapshot(q, (querySnapshot) => {
    const messages: any[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};
