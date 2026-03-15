import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);


// Function to fetch instructors from Firestore
export async function getInstructors() {
  try {
    // Query users where role is 'instructor'
    const usersCollection = collection(db, "users");
    const instructorsQuery = query(usersCollection, where("role", "==", "instructor"));
    const instructorsSnapshot = await getDocs(instructorsQuery);
    const instructorsList = instructorsSnapshot.docs.map(doc => doc.data());
    return instructorsList;
  } catch (error) {
    console.error("Error fetching instructors: ", error);
    return [];
  }
}


// Function to fetch students from Firestore
export async function getStudents() {
  try {
    // Query users where role is 'student'
    const usersCollection = collection(db, "users");
    const studentsQuery = query(usersCollection, where("role", "==", "student"));
    const studentsSnapshot = await getDocs(studentsQuery);
    const studentsList = studentsSnapshot.docs.map(doc => doc.data());
    return studentsList;
  } catch (error) {
    console.error("Error fetching students: ", error);
    return [];
  }
}
