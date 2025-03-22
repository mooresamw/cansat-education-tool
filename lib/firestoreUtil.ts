import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, onSnapshot, arrayUnion, updateDoc, getDoc } from "firebase/firestore";

// Updated Message interface for single-document structure
export interface Message {
  messageId: string; // Unique ID within the array (replacing 'id' since it's not a doc ID)
  sender: string;
  message: string; // Changed from 'messageText' to match your components
  timestamp: string; // Using ISO string instead of Timestamp for consistency
  reactions?: { [userId: string]: string }; // UserID -> emoji mapping
  edited?: boolean; // Added to track edits
}

/**
 * Generate a consistent conversation ID
 */
const getConversationId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join("_");
};

/**
 * Send a message to Firestore
 * @param senderId - ID of the sender
 * @param recipientId - ID of the recipient
 * @param messageText - The message text
 */
export const sendMessage = async (senderId: string, recipientId: string, messageText: string) => {
  try {
    const conversationId = getConversationId(senderId, recipientId);
    const conversationRef = doc(db, "messages", conversationId);
    const messageId = `${senderId}_${Date.now()}`; // Unique ID for each message

    await setDoc(
      conversationRef,
      {
        participants: [senderId, recipientId],
        messages: arrayUnion({
          messageId,
          sender: senderId,
          message: messageText,
          timestamp: new Date().toISOString(),
          reactions: {},
          edited: false,
        }),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    throw error; // Throwing error to match your components' try-catch
  }
};

/**
 * Add or toggle a reaction to a message
 * @param userId - ID of the user reacting
 * @param recipientId - ID of the other participant
 * @param messageId - ID of the message being reacted to
 * @param emoji - The emoji reaction
 */
export const handleReaction = async (userId: string, recipientId: string, messageId: string, emoji: string) => {
  try {
    const conversationId = getConversationId(userId, recipientId);
    const conversationRef = doc(db, "messages", conversationId);

    const docSnapshot = await getDoc(conversationRef);
    if (!docSnapshot.exists()) throw new Error("Conversation does not exist");

    const conversation = docSnapshot.data();
    const messageIndex = conversation.messages.findIndex((msg: Message) => msg.messageId === messageId);
    if (messageIndex === -1) throw new Error("Message not found");

    const updatedMessages = [...conversation.messages];
    const currentReactions = updatedMessages[messageIndex].reactions || {};

    // Toggle reaction: remove if same emoji, add/update otherwise
    if (currentReactions[userId] === emoji) {
      delete currentReactions[userId];
    } else {
      currentReactions[userId] = emoji;
    }
    updatedMessages[messageIndex].reactions = currentReactions;

    await updateDoc(conversationRef, {
      messages: updatedMessages,
    });
  } catch (error) {
    console.error("Error updating reaction:", error);
    throw error;
  }
};

/**
 * Edit an existing message
 * @param userId - ID of the user editing
 * @param recipientId - ID of the other participant
 * @param messageId - ID of the message being edited
 * @param newText - The new message text
 */
export const handleEditMessage = async (userId: string, recipientId: string, messageId: string, newText: string) => {
  try {
    const conversationId = getConversationId(userId, recipientId);
    const conversationRef = doc(db, "messages", conversationId);

    const docSnapshot = await getDoc(conversationRef);
    if (!docSnapshot.exists()) throw new Error("Conversation does not exist");

    const conversation = docSnapshot.data();
    const messageIndex = conversation.messages.findIndex((msg: Message) => msg.messageId === messageId);
    if (messageIndex === -1) throw new Error("Message not found");

    const updatedMessages = [...conversation.messages];
    updatedMessages[messageIndex].message = newText;
    updatedMessages[messageIndex].edited = true;

    await updateDoc(conversationRef, {
      messages: updatedMessages,
    });
  } catch (error) {
    console.error("Error editing message:", error);
    throw error;
  }
};

/**
 * Get messages between two users in real-time
 * @param userId1 - ID of the first user
 * @param userId2 - ID of the second user
 * @param callback - Function to handle real-time message updates
 */
export const getMessages = (userId1: string, userId2: string, callback: (messages: Message[]) => void) => {
  const conversationId = getConversationId(userId1, userId2);
  const conversationRef = doc(db, "messages", conversationId);

  const unsubscribe = onSnapshot(conversationRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      callback(data.messages || []);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};