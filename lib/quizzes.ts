// Quiz bank for the student training PDFs.
//
// Quizzes live in the Firestore `quizzes` collection, one document per PDF with
// the document id set to the PDF's display title (see `formatPdfName`). The PDF
// title is used as the key rather than the backend PDF id, because that id is
// just the storage listing index and shifts when PDFs are added or reordered.
//
// The hardcoded QUIZZES below act as a fallback for PDFs that don't yet have a
// quiz uploaded by an admin.

import { collection, getDocs, type Firestore } from "firebase/firestore"

export interface QuizOption {
  id: string
  text: string
  correct?: boolean
}

export interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
}

export interface Quiz {
  title: string
  questions: QuizQuestion[]
}

export const QUIZ_COLLECTION = "quizzes"

// Strips the uuid prefix and ".pdf" suffix from a stored PDF blob name to get
// the human-readable title used as the quiz key.
export const formatPdfName = (name: string) => name.split("-").pop()?.replace(/\.pdf$/i, "") ?? name

// Fetches every uploaded quiz in one read, keyed by PDF title.
export async function fetchQuizzes(db: Firestore): Promise<Record<string, QuizQuestion[]>> {
  const snapshot = await getDocs(collection(db, QUIZ_COLLECTION))
  const result: Record<string, QuizQuestion[]> = {}
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Quiz
    if (data?.questions?.length) {
      result[docSnap.id] = data.questions
    }
  })
  return result
}

export const QUIZZES: Record<string, QuizQuestion[]> = {
  "Introduction to outer space": [
    {
      id: "space-1",
      question: "What is the Kármán Line?",
      options: [
        { id: "a", text: "A common definition of where space begins, about 100 km (62 miles) above sea level", correct: true },
        { id: "b", text: "The boundary of the Milky Way galaxy" },
        { id: "c", text: "The path the ISS travels around Earth" },
        { id: "d", text: "The distance light travels in one year" },
      ],
    },
    {
      id: "space-2",
      question: "What was the first artificial Earth satellite?",
      options: [
        { id: "a", text: "Apollo 11" },
        { id: "b", text: "Sputnik, launched by the Soviet Union in 1957", correct: true },
        { id: "c", text: "The International Space Station" },
        { id: "d", text: "A V-2 rocket" },
      ],
    },
    {
      id: "space-3",
      question: "Who was the first human in space?",
      options: [
        { id: "a", text: "Neil Armstrong" },
        { id: "b", text: "Buzz Aldrin" },
        { id: "c", text: "Yuri Gagarin", correct: true },
        { id: "d", text: "Michael Collins" },
      ],
    },
    {
      id: "space-4",
      question: "Roughly how wide is the Milky Way galaxy?",
      options: [
        { id: "a", text: "100 kilometers" },
        { id: "b", text: "62 miles" },
        { id: "c", text: "100,000 light-years", correct: true },
        { id: "d", text: "110 million light-years" },
      ],
    },
  ],

  "What is Satellites": [
    {
      id: "sat-1",
      question: "What is a satellite?",
      options: [
        { id: "a", text: "An object with small mass orbiting a larger object", correct: true },
        { id: "b", text: "Any star in the night sky" },
        { id: "c", text: "A type of rocket engine" },
        { id: "d", text: "A ground station that tracks weather" },
      ],
    },
    {
      id: "sat-2",
      question: "How are artificial satellites launched into space?",
      options: [
        { id: "a", text: "By weather balloons" },
        { id: "b", text: "Using rockets, where the satellite is the payload", correct: true },
        { id: "c", text: "By high-altitude aircraft" },
        { id: "d", text: "They are assembled in orbit by astronauts" },
      ],
    },
    {
      id: "sat-3",
      question: "How long does the International Space Station take to orbit Earth once?",
      options: [
        { id: "a", text: "About 90 minutes", correct: true },
        { id: "b", text: "About 24 hours" },
        { id: "c", text: "About 1 week" },
        { id: "d", text: "About 1 year" },
      ],
    },
    {
      id: "sat-4",
      question: "Which of these is NOT something satellites help us do?",
      options: [
        { id: "a", text: "Predict the weather" },
        { id: "b", text: "Find our way with GPS" },
        { id: "c", text: "Communicate across oceans" },
        { id: "d", text: "Cook food in a microwave", correct: true },
      ],
    },
  ],

  "Introduction to Sensors": [
    {
      id: "sensor-1",
      question: "What does a sensor do for a machine or robot?",
      options: [
        { id: "a", text: "It acts like a sense, detecting things in its environment", correct: true },
        { id: "b", text: "It stores the program that runs the machine" },
        { id: "c", text: "It supplies electrical power to the machine" },
        { id: "d", text: "It launches the machine into space" },
      ],
    },
    {
      id: "sensor-2",
      question: "Which sensor is commonly used to calculate a CanSat's altitude?",
      options: [
        { id: "a", text: "Temperature sensor" },
        { id: "b", text: "Pressure sensor", correct: true },
        { id: "c", text: "Camera sensor" },
        { id: "d", text: "Microphone" },
      ],
    },
    {
      id: "sensor-3",
      question: "What does an accelerometer measure?",
      options: [
        { id: "a", text: "Air temperature at different altitudes" },
        { id: "b", text: "Atmospheric pressure" },
        { id: "c", text: "Acceleration, and it can also detect tilt", correct: true },
        { id: "d", text: "Latitude and longitude" },
      ],
    },
    {
      id: "sensor-4",
      question: "What does a GPS module provide for a CanSat?",
      options: [
        { id: "a", text: "Precise location data such as latitude, longitude, and altitude", correct: true },
        { id: "b", text: "The temperature of the air" },
        { id: "c", text: "The force of the air per unit area" },
        { id: "d", text: "The color of objects below it" },
      ],
    },
  ],

  "Intro to Microcontrollers": [
    {
      id: "micro-1",
      question: "What is a microcontroller?",
      options: [
        { id: "a", text: "A small computer chip designed to do a specific task", correct: true },
        { id: "b", text: "A large satellite dish" },
        { id: "c", text: "A type of rocket fuel" },
        { id: "d", text: "A sensor that measures pressure" },
      ],
    },
    {
      id: "micro-2",
      question: 'Which part of a microcontroller is referred to as "The Brain"?',
      options: [
        { id: "a", text: "Memory" },
        { id: "b", text: "Inputs/Outputs" },
        { id: "c", text: "The CPU", correct: true },
        { id: "d", text: "The power supply" },
      ],
    },
    {
      id: "micro-3",
      question: "What is Arduino?",
      options: [
        { id: "a", text: "A user-friendly platform/circuit board that makes it easy to work with microcontrollers", correct: true },
        { id: "b", text: "A brand of satellite" },
        { id: "c", text: "A programming language used only by experts" },
        { id: "d", text: "A type of temperature sensor" },
      ],
    },
    {
      id: "micro-4",
      question: 'Which part of a microcontroller acts as the "Ears and Mouth"?',
      options: [
        { id: "a", text: "The CPU" },
        { id: "b", text: "Inputs/Outputs", correct: true },
        { id: "c", text: "Memory" },
        { id: "d", text: "The notebook" },
      ],
    },
  ],
}

export function getQuizForTitle(title: string): QuizQuestion[] | undefined {
  return QUIZZES[title]
}
