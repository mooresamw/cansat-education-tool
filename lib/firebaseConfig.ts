import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBBp7LFwOfwS-7AbeWPBeADCBFCdAV69hs",
  authDomain: "cansat-education-tool.firebaseapp.com",
  projectId: "cansat-education-tool",
  storageBucket: "cansat-education-tool.firebasestorage.app",
  messagingSenderId: "293736072539",
  appId: "1:293736072539:web:d85cb7130cc4f0fd02867e",
  measurementId: "G-FPX0J8647Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Function to fetch instructors from Firestore
export async function getInstructors() {
  try {
    // Query users where role is 'instructor'
    const usersCollection = collection(db, 'users');
    const instructorsQuery = query(usersCollection, where("role", "==", "instructor"));
    const instructorsSnapshot = await getDocs(instructorsQuery);
    const instructorsList = instructorsSnapshot.docs.map(doc => doc.data());
    return instructorsList;
  } catch (error) {
    console.error("Error fetching instructors: ", error);
    return [];
  }
}
