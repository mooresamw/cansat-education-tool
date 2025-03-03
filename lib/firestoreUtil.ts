import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot, Timestamp } from "firebase/firestore";

//Added the Message interface
export interface Message {
  id: string;
  sender: string;
  recipient: string;
  message: string;
  timestamp: Timestamp;
  reactions?: {
    [emoji: string] : number;
  }
}

/**
 * Send a message to Firestore
 * @param senderId - ID of the sender (student)
 * @param recipientId - ID of the recipient (instructor)
 * @param messageText - The message text
 */

//Update the send message ( added reactions initialization)
export const sendMessage = async (senderId: string, recipientId: string, messageText: string) => {
  try {
    await addDoc(collection(db, "messages"), {
      sender: senderId,
      recipient: recipientId,
      message: messageText,
      timestamp: Timestamp.now(),
      reactions: {},
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

//Changed the return type of the callback function to void
export const getMessages = (
  studentId: string,
  instructorId: string,
  callback: (messages:Message[]) => void
) => {
  const q = query(
    collection(db, "messages"),
    where("sender", "in", [studentId, instructorId]),
    where("recipient", "in", [studentId, instructorId]),
    orderBy("timestamp", "asc")
  );

  // Real-time listener for messages
  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        sender: data.sender,
        recipient: data.recipient,
        message: data.message,
        timestamp: data.timestamp,
        reactions: data.reactions || {},
      })
    });
    callback(messages);
  });
};
