"use client"

import { useEffect, useMemo, useState, useContext } from "react"
import { Document, Page } from "react-pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, CheckCircle, Download } from "lucide-react"
import { pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import Loading from "@/components/Loading"
import { Progress } from "@/components/ui/progress"
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebaseConfig"
import { SignOutContext } from "@/components/DashboardLayout"
import { onAuthStateChanged } from "firebase/auth"
import Editor from "@monaco-editor/react"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFFile {
  id: string
  name: string
  url: string
}

interface CompletedPDF {
  material_id: string
  completion_date: string
}

interface CodeResource {
  id: string
  name: string
  description: string
  language: string
  code: string
  filename: string
}

export default function StudentTrainingMaterials() {
  const { isSigningOut } = useContext(SignOutContext)
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | undefined>(undefined)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [notes, setNotes] = useState("")
  const [pdfs, setPdfs] = useState<PDFFile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [completedPdfs, setCompletedPdfs] = useState<CompletedPDF[]>([])
  const [progressPercent, setProgressPercent] = useState(0)
  const [activeTab, setActiveTab] = useState("pdfs")

  const [selectedCodeResource, setSelectedCodeResource] = useState<CodeResource | undefined>(undefined)

const codeResources: CodeResource[] = [
  {
    id: "mpu6050",
    name: "MPU6050 Sensor Calibration",
    description: "Example code for calibrating and reading data from an MPU6050 accelerometer and gyroscope",
    language: "cpp",
    filename: "MPU6050.ino",
    code: `#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

Adafruit_MPU6050 mpu;

// Variables to store offsets
float accelX_offset = 0, accelY_offset = 0, accelZ_offset = 0;
float gyroX_offset = 0, gyroY_offset = 0, gyroZ_offset = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial) {
    delay(10);
  }

  // Set ranges
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  // Calibrate sensor
  calibrateMPU6050();
  Serial.println("Calibration complete!");
  Serial.print("Accel Offsets (X, Y, Z): ");
  Serial.print(accelX_offset); Serial.print(", ");
  Serial.print(accelY_offset); Serial.print(", ");
  Serial.println(accelZ_offset);
  Serial.print("Gyro Offsets (X, Y, Z): ");
  Serial.print(gyroX_offset); Serial.print(", ");
  Serial.print(gyroY_offset); Serial.print(", ");
  Serial.println(gyroZ_offset);
}

void calibrateMPU6050() {
  const int samples = 1000; // Number of samples to average
  float accelX_sum = 0, accelY_sum = 0, accelZ_sum = 0;
  float gyroX_sum = 0, gyroY_sum = 0, gyroZ_sum = 0;

  Serial.println("Keep the sensor stationary during calibration...");
  delay(2000); // Wait for sensor to stabilize

  for (int i = 0; i < samples; i++) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    accelX_sum += a.acceleration.x;
    accelY_sum += a.acceleration.y;
    accelZ_sum += a.acceleration.z;
    gyroX_sum += g.gyro.x;
    gyroY_sum += g.gyro.y;
    gyroZ_sum += g.gyro.z;

    delay(10); // Small delay between readings
  }

  // Calculate average offsets
  accelX_offset = accelX_sum / samples;
  accelY_offset = accelY_sum / samples;
  accelZ_offset = (accelZ_sum / samples) - 9.81; // Subtract gravity for Z-axis
  gyroX_offset = gyroX_sum / samples;
  gyroY_offset = gyroY_sum / samples;
  gyroZ_offset = gyroZ_sum / samples;
}

void loop() {
  // Get new sensor readings
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Apply offsets
  float accelX = a.acceleration.x - accelX_offset;
  float accelY = a.acceleration.y - accelY_offset;
  float accelZ = a.acceleration.z - accelZ_offset;
  float gyroX = g.gyro.x - gyroX_offset;
  float gyroY = g.gyro.y - gyroY_offset;
  float gyroZ = g.gyro.z - gyroZ_offset;

  // Print calibrated data
  Serial.print("Calibrated Accel X: "); Serial.print(accelX); Serial.print(" m/s^2, ");
  Serial.print("Y: "); Serial.print(accelY); Serial.print(" m/s^2, ");
  Serial.print("Z: "); Serial.print(accelZ); Serial.println(" m/s^2");
  Serial.print("Calibrated Gyro X: "); Serial.print(gyroX); Serial.print(" rad/s, ");
  Serial.print("Y: "); Serial.print(gyroY); Serial.print(" rad/s, ");
  Serial.print("Z: "); Serial.print(gyroZ); Serial.println(" rad/s");
  Serial.println("");

  delay(500);
}`
  },
  {
    id: "veml7700",
    name: "VEML7700 Light Sensor",
    description: "Basic example for reading light intensity using the VEML7700 sensor",
    language: "cpp",
    filename: "VEML7700_Easy.ino",
    code: `#include "Adafruit_VEML7700.h" // We need a special instruction book to talk to our light sensor robot!

// Let's give our light sensor robot a name, "lightSensor".
Adafruit_VEML7700 lightSensor = Adafruit_VEML7700();

const int LED_PIN = 2;
void setup() {

  // This is where our Arduino gets ready!
  Serial.begin(9600); // Start talking to the computer (chat window).
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  float lux = lightSensor.readLux(VEML_LUX_AUTO);  // Ask the "lightSensor" robot how bright it is (the "lux" number).
  Serial.print("How bright is it? "); // Print a friendly message.
  Serial.print(lux);                  // Show the brightness number.
  Serial.println(" lux");             // Add " lux" and go to a new line.

  delay(1000); 
}`
  },
  {
    id: "mpu-led",
    name: "MPU6050 with LED Control",
    description: "Example code for controlling an LED based on MPU6050 motion detection",
    language: "cpp",
    filename: "MPU_wLED.ino",
    code: `#include <Wire.h>          // For I2C communication (how the Arduino talks to the sensor).
#include <Adafruit_MPU6050.h> // For the MPU6050 motion sensor itself.
#include <Adafruit_Sensor.h> // A helper book for many Adafruit sensors.
Adafruit_MPU6050 motionSensor;
const int LED_PIN = 2;

void setup() {
  Serial.begin(9600); // Start talking to the computer (like a little chat window).
  pinMode(LED_PIN, OUTPUT); // Tell Arduino that pin 2 will send out power for our LED.
  Serial.println("Great! Motion sensor found and ready!");
}

void loop() {
  sensors_event_t a, g, temp; // 'a' for acceleration.
  motionSensor.getEvent(&a, &g, &temp); // Get the latest information from the sensor.

  Serial.print("X-motion: "); Serial.print(a.acceleration.x, 2); // Print with 2 decimal places.

  Serial.print("   Y-motion: "); Serial.print(a.acceleration.y, 2);

  Serial.print("   Z-motion: "); Serial.print(a.acceleration.z, 2);

  Serial.println(); // Move to the next line in the chat window.

  if (abs(a.acceleration.x) > 17.0 || abs(a.acceleration.y) > 17.0 || abs(a.acceleration.z) > 17.0) {
    digitalWrite(LED_PIN, HIGH); // Turn the LED ON!
    Serial.println(">>> WHOA! Motion detected! LED is ON! <<<");
  } else {
    digitalWrite(LED_PIN, LOW); // Turn the LED OFF!
    Serial.println("--- No big motion. LED is OFF. ---");}
    
  delay(2000); } // Wait a little bit (0.2 seconds) before checking again.`
  },
  {
    id: "veml-led",
    name: "VEML7700 with LED Control",
    description: "Code for controlling an LED based on light intensity from the VEML7700 sensor",
    language: "cpp",
    filename: "VEML_wLED.ino",
    code: `// We need a special instruction book to talk to our light sensor robot!
#include "Adafruit_VEML7700.h"

// Let's give our light sensor robot a name, "lightSensor".
Adafruit_VEML7700 lightSensor = Adafruit_VEML7700();
const int LED_PIN = 2; // Tell the Arduino which pin the LED is connected to.

void setup() {
  // This is where our Arduino gets ready!
  Serial.begin(9600); // Start talking to the computer (chat window).
  pinMode(LED_PIN, OUTPUT); // Tell Arduino that this pin will control an LED (output light).
}

void loop() {
  // This is what our Arduino does over and over again!

  // Ask the "lightSensor" robot how bright it is (the "lux" number).
  float lux = lightSensor.readLux(VEML_LUX_AUTO);

  Serial.print("How bright is it? "); // Print a friendly message.
  Serial.print(lux);                  // Show the brightness number.
  Serial.println(" lux");             // Add " lux" and go to a new line.

  // Now, let's make the LED turn on if it's super bright!


  delay(1000); // Wait for 1 second before checking again.
}`
  },
  {
    id: "bmp-led",
    name: "BMP180 with LED Control",
    description: "Code for controlling an LED based on temperature from the BMP180 sensor",
    language: "cpp",
    filename: "BMP_wLED.ino",
    code: `#include <Wire.h>             // For talking using I2C (the sensor's language).
#include <Adafruit_BMP085.h>  // For the BMP180 sensor itself.

Adafruit_BMP085 weatherBot;

const int LED_PIN = 2; // We'll use an LED on digital pin 2.

void setup() {
  Serial.begin(9600);      // Start the chat window.
  pinMode(LED_PIN, OUTPUT); // Set up the LED pin.
}

void loop() {
  float currentTemperature = weatherBot.readTemperature(); // Temperature in Celsius.
  float currentPressure = weatherBot.readPressure();       // Pressure in Pascals.

  // --- Temperature ---
  Serial.print("Current Temperature: ");
  Serial.print(currentTemperature, 2);
  Serial.println(" °C");

  // --- Pressure ---
  Serial.print("Current Pressure: ");
  Serial.print(currentPressure);
  Serial.println(" Pa");

  // --- LED control based on temperature ---
  if ( ) {
    digitalWrite( );
    Serial.println("  *** It's WARM! LED is ON! ***");
  } else {
    digitalWrite( );
    Serial.println("  It's cool. LED is OFF.");
  }

  Serial.println(); // Blank line for readability
  delay(1000);
}`
  },
  {
    id: "bmp180",
    name: "BMP180 Sensor Reading",
    description: "Basic example for reading temperature, pressure, and altitude from the BMP180 sensor",
    language: "cpp",
    filename: "BMP180.ino",
    code: `// connect the BMP180 to the Arduino like this:
// Arduino - BMP180
// 5V ------ VCC
// GND ----- GND
// A4 ------ SDA
// A5 ------ SCL

#include <Wire.h>             // Enables I2C communication protocol.
#include <Adafruit_BMP085.h>  // Provides functions for the BMP180/BMP085 sensor.

Adafruit_BMP085 bmp;          // Instantiates the BMP085 sensor object.

void setup() {
  Serial.begin(9600);         // Initializes serial communication at 9600 baud for debugging.
}

void loop() {
  Serial.print("Temperature: ");
  Serial.print(bmp.readTemperature());  // Reads and prints temperature in Celsius.
  Serial.println(" °C");

  Serial.print("Pressure: ");
  Serial.print(bmp.readPressure());     // Reads and prints pressure in Pascals.
  Serial.println(" Pa");

  Serial.print("Altitude: ");
  Serial.print(bmp.readAltitude(101325)); // Reads and prints altitude in meters, using sea level pressure of 101325 Pa.
  Serial.println(" m");

  Serial.println();  // Blank line for readability
  delay(1000);       // Pauses execution for 1 second.
}`
  },
  {
    id: "gps",
    name: "GPS Data Reading",
    description: "Example for reading and displaying GPS data using the TinyGPSPlus library",
    language: "cpp",
    filename: "GY_GPS_working.ino",
    code: `#include <TinyGPSPlus.h>
#include <SoftwareSerial.h>

// Pin configuration
const int RXPin = 4; // GPS TX to Arduino D4
const int TXPin = 3; // GPS RX to Arduino D3
const int GPSBaud = 9600;

// Create objects
TinyGPSPlus gps;
SoftwareSerial gpsSerial(RXPin, TXPin);

void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial (for Leonardo, etc.)
  Serial.println("Sketch started! Initializing GPS...");
  delay(100);
  gpsSerial.begin(GPSBaud);
  Serial.println("GPS module initialized. Waiting for data...");
  delay(100);
}

void loop() {
  // Process all available GPS data
  bool dataReceived = false;
  while (gpsSerial.available() > 0) {
    dataReceived = true;
    char c = gpsSerial.read();
    // Serial.print(c); // Uncomment to debug raw NMEA data
    if (gps.encode(c)) {
      displayInfo();
    }
  }

  // Debug: Indicate if no data was received
  if (!dataReceived && millis() % 1000 < 10) { // Print every ~1s
    Serial.println("No GPS data received in this loop.");
  }

  // Check for no GPS data after 5 seconds
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("No GPS data detected. Check wiring, power, or baud rate.");
  }
  delay(100); // Prevent overwhelming the CPU
}

void displayInfo() {
  Serial.println("Processing GPS data...");
  
  if (gps.location.isValid()) {
    Serial.print("Latitude: ");
    Serial.println(gps.location.lat(), 6);
    Serial.print("Longitude: ");
    Serial.println(gps.location.lng(), 6);
    if (gps.satellites.isValid()) {
      Serial.print("Satellites: ");
      Serial.println(gps.satellites.value());
    }
  } else {
    Serial.println("Location: Not Available");
    if (gps.satellites.isValid()) {
      Serial.print("Satellites: ");
      Serial.println(gps.satellites.value());
    } else {
      Serial.println("Satellite data: Not Available");
    }
  }

  Serial.print("Date: ");
  if (gps.date.isValid()) {
    Serial.print(gps.date.month());
    Serial.print("/");
    Serial.print(gps.date.day());
    Serial.print("/");
    Serial.println(gps.date.year());
  } else {
    Serial.println("Not Available");
  }

  Serial.print("Time (Local): ");
  const int timeZoneOffset = -4; // Adjust for your time zone (e.g., EDT = -4)
  if (gps.time.isValid()) {
    int utcHour = gps.time.hour();
    int localHour = (utcHour + timeZoneOffset + 24) % 24;
    if (localHour < 10) Serial.print("0");
    Serial.print(localHour);
    Serial.print(":");
    if (gps.time.minute() < 10) Serial.print("0");
    Serial.print(gps.time.minute());
    Serial.print(":");
    if (gps.time.second() < 10) Serial.print("0");
    Serial.println(gps.time.second());
  } else {
    Serial.println("Not Available");
  }

  Serial.println();
}`
  }
]

  useEffect(() => {
    if (codeResources.length > 0 && !selectedCodeResource) {
      setSelectedCodeResource(codeResources[0])
    }
  }, [])

  const downloadCode = () => {
    if (!selectedCodeResource) return

    const blob = new Blob([selectedCodeResource.code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = selectedCodeResource.filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Set up authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        setUserId(null)
        setNotes("")
      }
    })
    return () => unsubscribe()
  }, [])

  // Fetch PDFs and progress
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!isMounted || isSigningOut || !userId) return

      try {
        setLoading(true)
        const pdfResponse = await fetch("https://cansat-education-tool.onrender.com/get-pdfs")
        if (!pdfResponse.ok) throw new Error("Failed to fetch PDFs")
        const pdfData: PDFFile[] = await pdfResponse.json()
        if (!isMounted) return
        setPdfs(pdfData)

        const progressResponse = await fetch(
          `https://cansat-education-tool.onrender.com/get-user-progress?user_id=${userId}&type=training_material`,
        )
        if (!progressResponse.ok) throw new Error("Failed to fetch user progress")
        const progressData: CompletedPDF[] = await progressResponse.json()
        if (!isMounted) return
        setCompletedPdfs(progressData)

        const progressPercentage = pdfData.length > 0 ? (progressData.length / pdfData.length) * 100 : 0
        setProgressPercent(progressPercentage)

        if (pdfData.length > 0) {
          const completedIds = progressData.map((item) => item.material_id)
          const firstUncompletedPdf = pdfData.find((pdf) => !completedIds.includes(pdf.id))
          setSelectedPdf(firstUncompletedPdf || pdfData[0])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (userId) fetchData()
    return () => {
      isMounted = false
    }
  }, [userId, isSigningOut])

  // Load notes when selected PDF changes
  useEffect(() => {
    let isMounted = true

    const loadNotes = async () => {
      if (!isMounted || !selectedPdf || !userId || isSigningOut) return

      try {
        const user = auth.currentUser
        if (!user) {
          console.log("No authenticated user; skipping note loading")
          return
        }
        const noteDocRef = doc(db, "users", userId, "notes", selectedPdf.id)
        const noteDoc = await getDoc(noteDocRef)
        if (!isMounted) return
        setNotes(noteDoc.exists() ? noteDoc.data().content || "" : "")
      } catch (error: any) {
        console.error("Error loading notes:", error)
        if (error.code === "permission-denied") {
          console.log("Permission denied; likely due to sign-out")
          if (isMounted) setNotes("")
        }
      }
    }

    loadNotes()
    return () => {
      isMounted = false
    }
  }, [selectedPdf, userId, isSigningOut])

  // Save notes to Firestore
  const saveNotes = async () => {
    if (!selectedPdf || !userId || isSigningOut) return

    try {
      const user = auth.currentUser
      if (!user) {
        console.log("No authenticated user; skipping note saving")
        return
      }
      const noteDocRef = doc(db, "users", userId, "notes", selectedPdf.id)
      await setDoc(noteDocRef, {
        content: notes,
        pdfId: selectedPdf.id,
        updatedAt: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error saving notes:", error)
      if (error.code !== "permission-denied") {
        alert("Failed to save notes. Please try again.")
      }
    }
  }

  // Delete notes from Firestore
  const deleteNotes = async () => {
    if (!selectedPdf || !userId || isSigningOut) return

    try {
      const user = auth.currentUser
      if (!user) {
        console.log("No authenticated user; skipping note deletion")
        return
      }
      const noteDocRef = doc(db, "users", userId, "notes", selectedPdf.id)
      await deleteDoc(noteDocRef)
      setNotes("")
    } catch (error: any) {
      console.error("Error deleting notes:", error)
      if (error.code !== "permission-denied") {
        alert("Failed to delete notes. Please try again.")
      }
    }
  }

  // Mark PDF as completed and move to next uncompleted PDF
  const markAsCompleted = async () => {
    if (!selectedPdf || !userId || isSigningOut) return
    if (isPdfCompleted(selectedPdf.id)) return // Skip if already completed

    try {
      const user = auth.currentUser
      if (!user) {
        console.log("No authenticated user; skipping mark as completed")
        return
      }
      const response = await fetch("https://cansat-education-tool.onrender.com/mark-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          material_id: selectedPdf.id,
          type: "training_material",
          title: selectedPdf.name,
          accessed_at: new Date().toISOString(),
          completed: true,
          completion_date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const newCompletedPdf = {
          material_id: selectedPdf.id,
          completion_date: new Date().toISOString(),
        }

        const updatedCompletedPdfs = [...completedPdfs, newCompletedPdf]
        setCompletedPdfs(updatedCompletedPdfs)

        const newProgressPercent = pdfs.length > 0 ? (updatedCompletedPdfs.length / pdfs.length) * 100 : 0
        setProgressPercent(newProgressPercent)

        const completedIds = updatedCompletedPdfs.map((item) => item.material_id)
        const nextUncompletedPdf = pdfs.find((pdf) => !completedIds.includes(pdf.id))

        if (nextUncompletedPdf) {
          setSelectedPdf(nextUncompletedPdf)
          setPageNumber(1)
          setNumPages(null)
        }
      }
    } catch (error) {
      console.error("Error sending completion data", error)
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset
      if (numPages && newPageNumber === numPages && selectedPdf && !isPdfCompleted(selectedPdf.id)) {
        markAsCompleted()
      }
      return Math.min(Math.max(1, newPageNumber), numPages || 1)
    })
  }

  const isPdfCompleted = (pdfId: string) => {
    return completedPdfs.some((pdf) => pdf.material_id === pdfId)
  }

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: "/cmaps/",
      cMapPacked: true,
    }),
    [],
  )

  if (loading || !userId) return <Loading />

  return (
    <div className="flex flex-col space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pdfs">PDF Resources</TabsTrigger>
          <TabsTrigger value="coding">Coding Resources</TabsTrigger>
        </TabsList>

        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress: {Math.round(progressPercent)}% Complete</span>
            <span className="text-sm font-medium">
              {completedPdfs.length} of {pdfs.length} PDFs
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <TabsContent value="pdfs" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {pdfs.map((pdf, index) => (
              <div
                key={pdf.id}
                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 cursor-pointer ${
                  isPdfCompleted(pdf.id)
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-gray-100 text-gray-800 border border-gray-300"
                } ${selectedPdf?.id === pdf.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedPdf(pdf)}
              >
                {isPdfCompleted(pdf.id) && <CheckCircle className="h-3 w-3" />}
                {index + 1}. {pdf.name.length > 15 ? `${pdf.name.substring(0, 15)}...` : pdf.name}
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <div className="w-2/3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {selectedPdf && isPdfCompleted(selectedPdf.id) && (
                      <span className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> Completed
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Select
                      value={selectedPdf?.id}
                      onValueChange={(value) => {
                        const newSelectedPdf = pdfs.find((pdf) => pdf.id === value)
                        if (newSelectedPdf) {
                          setSelectedPdf(newSelectedPdf)
                          setPageNumber(1)
                          setNumPages(null)
                        }
                      }}
                    >
                      <SelectTrigger className="block md:hidden">
                        <SelectValue placeholder="Select a PDF" />
                      </SelectTrigger>
                      <SelectContent>
                        {pdfs.map((pdf) => (
                          <SelectItem key={pdf.id} value={pdf.id}>
                            <div className="flex items-center">
                              {isPdfCompleted(pdf.id) && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                              {pdf.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg overflow-auto h-[450px] w-[700px]">
                    {selectedPdf && (
                      <Document file={selectedPdf.url} onLoadSuccess={onDocumentLoadSuccess} options={pdfOptions}>
                        <Page pageNumber={pageNumber} width={700} />
                      </Document>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <Button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <p>
                      Page {pageNumber} of {numPages}
                    </p>
                    <Button onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add your notes here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-[400px] mb-2"
                    disabled={isSigningOut || !userId}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={saveNotes} disabled={!selectedPdf || !notes.trim() || isSigningOut || !userId}>
                      Save Notes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deleteNotes}
                      disabled={!selectedPdf || !notes || isSigningOut || !userId}
                    >
                      Delete Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="coding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coding Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select
                  value={selectedCodeResource?.id}
                  onValueChange={(value) => {
                    const newSelectedCode = codeResources.find((code) => code.id === value)
                    if (newSelectedCode) {
                      setSelectedCodeResource(newSelectedCode)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a code example" />
                  </SelectTrigger>
                  <SelectContent>
                    {codeResources.map((codeResource) => (
                      <SelectItem key={codeResource.id} value={codeResource.id}>
                        {codeResource.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCodeResource && <p className="text-gray-600 mb-4">{selectedCodeResource.description}</p>}

              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  defaultLanguage={selectedCodeResource?.language || "cpp"}
                  value={selectedCodeResource?.code || ""}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                  }}
                />
              </div>
              <div className="mt-4">
                <Button onClick={downloadCode} disabled={!selectedCodeResource}>
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedCodeResource?.name || "Code"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
