import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, onSnapshot, arrayUnion, updateDoc, getDoc } from "firebase/firestore";

export interface Message {
  messageId: string;
  sender: string;
  message: string;
  timestamp: string;
  reactions?: { [userId: string]: string };
  edited?: boolean;
  read?: { [userId: string]: boolean };
}

export const getConversationId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join("_");
};

export const sendMessage = async (senderId: string, recipientId: string, messageText: string) => {
  try {
    const conversationId = getConversationId(senderId, recipientId);
    const conversationRef = doc(db, "messages", conversationId);
    const messageId = `${senderId}_${Date.now()}`;

    const newMessage: Message = {
      messageId,
      sender: senderId,
      message: messageText,
      timestamp: new Date().toISOString(),
      reactions: {},
      edited: false,
      read: {
        [senderId]: true,
        [recipientId]: false,
      },
    };

    await setDoc(
      conversationRef,
      {
        participants: [senderId, recipientId],
        messages: arrayUnion(newMessage),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

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

export const markMessageAsRead = async (userId: string, conversationId: string, messageId: string) => {
  try {
    const conversationRef = doc(db, "messages", conversationId);

    const docSnapshot = await getDoc(conversationRef);
    if (!docSnapshot.exists()) throw new Error("Conversation does not exist");

    const conversation = docSnapshot.data();
    const messageIndex = conversation.messages.findIndex((msg: Message) => msg.messageId === messageId);
    if (messageIndex === -1) throw new Error("Message not found");

    const updatedMessages = [...conversation.messages];
    const currentReadStatus = updatedMessages[messageIndex].read || {};

    updatedMessages[messageIndex].read = {
      ...currentReadStatus,
      [userId]: true,
    };

    await updateDoc(conversationRef, {
      messages: updatedMessages,
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

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