import { db } from "./firebase";
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export const createUserProfile = async (user: User) => {
  if (!user) return;
  
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        tier: "Free",
      });
    } catch (error) {
      console.error("Error creating user profile", error);
    }
  }
};

export const createChat = async (userId: string, title: string) => {
  const chatRef = await addDoc(collection(db, "chats"), {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return chatRef.id;
};

export const addMessage = async (chatId: string, role: "user" | "assistant", content: string, metadata?: any) => {
  const msgRef = await addDoc(collection(db, `chats/${chatId}/messages`), {
    role,
    content,
    metadata: metadata || null,
    createdAt: serverTimestamp(),
  });
  return msgRef.id;
};

export const getMessages = async (chatId: string) => {
  const q = query(collection(db, `chats/${chatId}/messages`), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserChats = async (userId: string) => {
  const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.filter(doc => doc.data().userId === userId).map(doc => ({ id: doc.id, ...doc.data() }));
};
