import { db } from "@/lib/firebaseConfig.ts";
import { doc, onSnapshot, updateDoc, arrayUnion, setDoc, getDoc } from "firebase/firestore";

export const getMessages = (chatId: string, callback: (messages: any[]) => void) => {
  const chatRef = doc(db, "chats", chatId);
  return onSnapshot(chatRef, (snapshot) => {
    const data = snapshot.data();
    callback(data?.messages || []);
  });
};

export const sendMessage = async (chatId: string, senderId: string, message: string, participants: string[]) => {
  const chatRef = doc(db, "chats", chatId);
  const timestamp = new Date().toISOString();
  const messageId = `${chatId}_${Date.now()}`;
  const newMessage = {
    edited: false,
    message,
    messageId,
    reactions: {},
    read: { [senderId]: true },
    sender: senderId,
    timestamp,
  };

  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      lastUpdated: timestamp,
      messages: [newMessage],
      participants,
      isGroupChat: participants.length > 2,
    });
  } else {
    await updateDoc(chatRef, {
      lastUpdated: timestamp,
      messages: arrayUnion(newMessage),
    });
  }
};

export const markMessageAsRead = async (chatId: string, userId: string, messageId: string) => {
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    const messages = chatSnap.data().messages;
    const updatedMessages = messages.map((msg: any) =>
      msg.messageId === messageId ? { ...msg, read: { ...msg.read, [userId]: true } } : msg
    );
    await updateDoc(chatRef, { messages: updatedMessages });
  }
};

export const handleReaction = async (chatId: string, userId: string, messageId: string, emoji: string) => {
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    const messages = chatSnap.data().messages;
    const updatedMessages = messages.map((msg: any) =>
      msg.messageId === messageId ? { ...msg, reactions: { ...msg.reactions, [userId]: emoji } } : msg
    );
    await updateDoc(chatRef, { messages: updatedMessages });
  }
};

export const handleEditMessage = async (chatId: string, userId: string, messageId: string, newText: string) => {
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    const messages = chatSnap.data().messages;
    const updatedMessages = messages.map((msg: any) =>
      msg.messageId === messageId && msg.sender === userId
        ? { ...msg, message: newText, edited: true }
        : msg
    );
    await updateDoc(chatRef, { messages: updatedMessages });
  }
};