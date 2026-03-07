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
    id: "BMP180",
    name: "BMP180",
    description: "",
    language: "cpp",
    filename: "BMP180.ino",
    code: `// BMP180_I2C.ino
//
//
// connect the BMP180 to the Arduino like this:
// Arduino - BMC180
// 5V ------ VCC
// GND ----- GND
// A4 ----- SDA
// A5 ----- SCL

#include <Wire.h>
#include <Adafruit_BMP085.h>

Adafruit_BMP085 bmp;

void setup() {
  Serial.begin(9600);
  if (!bmp.begin()) {
    Serial.println("Could not find BMP180 sensor, check wiring!");
    while (1);
  }
}

void loop() {
  Serial.print("Temperature: ");
  Serial.print(bmp.readTemperature());
  Serial.println(" degC");
  Serial.print("Pressure: ");
  Serial.print(bmp.readPressure());
  Serial.println(" Pa");
  Serial.print("Altitude: ");
  Serial.print(bmp.readAltitude());
  Serial.println(" ft");
  delay(1000);
}`
  },
  {
    id: "BMP_wLED",
    name: "BMP_wLED",
    description: "",
    language: "cpp",
    filename: "BMP_wLED.ino",
    code: `#include <Wire.h>             // For talking using I2C (the sensor's language).
#include <Adafruit_BMP085.h>  // For the BMP180 sensor itself.

Adafruit_BMP085 bmp;

const int LED_PIN = 2; // We'll use an LED on digital pin 2.

void setup() {
  Serial.begin(9600);      // Start the chat window.
  pinMode(LED_PIN, OUTPUT); // Set up the LED pin.
  if (!bmp.begin()) {
  Serial.println("Could not find BMP180 sensor, check wiring!");
  while (1);
  }
}

void loop() {
  float currentTemperature = bmp.readTemperature(); // Temperature in Celsius.
  float currentPressure = bmp.readPressure();       // Pressure in Pascals.

  // --- Temperature ---
  Serial.print("Current Temperature: ");
  Serial.print(currentTemperature, 2);
  Serial.println(" °C");

  // --- LED control based on temperature ---
  if (currentTemperature > 30) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("  *** It's WARM! LED is ON! ***");
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("  It's cool. LED is OFF.");
  }

  Serial.println(); // Blank line for readability
  delay(1000);
}
`
  },
  {
    id: "CansatTransmit",
    name: "CansatTransmit",
    description: "",
    language: "cpp",
    filename: "CansatTransmit.ino",
    code: `// CanSatTransmit.ino
// This Arduino sketch reads sensor data and transmits it via nRF24L01 radio
// and also sends it to the serial port in a binary format for the Processing GUI.

#include <Wire.h>
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <Adafruit_BMP085.h>
#include <SoftwareSerial.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_VEML7700.h>
#include <TinyGPSPlus.h> // Include TinyGPSPlus

// nRF24L01 setup
RF24 radio(9, 10); // CE, CSN pins
const byte address[6] = "00001";

// Sensor objects
Adafruit_BMP085 bmp;
SoftwareSerial gpsSerial(3, 4); // RX, TX for GY-GPS6MV2
TinyGPSPlus gps;
Adafruit_MPU6050 mpu;
Adafruit_VEML7700 veml = Adafruit_VEML7700();

// MPU6050 calibration offsets
float accelX_offset = 0, accelY_offset = 0, accelZ_offset = 0;

// Data structure for transmission
// Total size: 9 floats * 4 bytes/float = 36 bytes
struct DataPacket {
  float accelX, accelY, accelZ; // 12 bytes
  float temperature;            // 4 bytes
  float pressure;               // 4 bytes
  float altitude;               // 4 bytes
  float lux;                    // 4 bytes
  float latitude, longitude;    // 8 bytes
};

// Split packets to respect 32-byte max payload
struct Packet1 {
  float accelX, accelY, accelZ; // 12 bytes
  float temperature;            // 4 bytes
  float pressure;               // 4 bytes
  // Total: 20 bytes
};

struct Packet2 {
  float altitude;               // 4 bytes
  float lux;                    // 4 bytes
  float latitude, longitude;    // 8 bytes
  // Total: 16 bytes
};

DataPacket data;

// Header byte for serial communication with Processing
const char HEADER_BYTE = 'H';

// Packet identifiers
const byte PACKET1_ID = 0x01;
const byte PACKET2_ID = 0x02;

// --- IMPORTANT: Adjust this value for accurate altitude readings ---
// Find your current local sea-level pressure (in Pascals) from a weather source.
// Example: If local pressure is 1012 millibars (mb), set this to 101200.0 Pa.
// For August 2025 testing, check local weather (e.g., ~101000 Pa depending on location).
const float SEA_LEVEL_PRESSURE_PA = 101325.0; // <-- CHANGE THIS TO YOUR LOCAL SEA-LEVEL PRESSURE

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600);
  Wire.begin();

  // Initialize nRF24L01
  Serial.println("Transmitter starting...");
  if (!radio.begin()) {
    Serial.println("Radio failed to initialize!");
    while (1);
  }
  if (!radio.isChipConnected()) {
    Serial.println("nRF24L01 chip not connected! Check wiring/power.");
    while (1);
  }
  
  radio.setPALevel(RF24_PA_MAX);
  radio.setDataRate(RF24_250KBPS); // Lower rate for better reliability
  radio.setChannel(76);
  radio.setRetries(15, 15); // Max delay, max retries
  radio.openWritingPipe(address);
  radio.stopListening();
  
  Serial.println("Transmitter config:");
  radio.printDetails(); // Print radio registers for debugging

  // Initialize BMP180
  if (!bmp.begin()) {
    Serial.println("BMP180 not found!");
    while (1);
  }

  // Initialize MPU6050
  if (!mpu.begin()) {
    Serial.println("MPU6050 not found!");
    while (1);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  calibrateMPU6050();

  // Initialize VEML7700
  if (!veml.begin()) {
    Serial.println("VEML7700 not found!");
    while (1);
  }

  Serial.println("Transmitter initialized");
}

void calibrateMPU6050() {
  const int samples = 1000;
  float accelX_sum = 0, accelY_sum = 0, accelZ_sum = 0;

  Serial.println("Calibrating MPU6050...");
  delay(2000);

  for (int i = 0; i < samples; i++) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    accelX_sum += a.acceleration.x;
    accelY_sum += a.acceleration.y;
    accelZ_sum += a.acceleration.z;
    delay(1); // Small delay to allow sensor readings to stabilize
  }

  accelX_offset = accelX_sum / samples;
  accelY_offset = accelY_sum / samples;
  accelZ_offset = (accelZ_sum / samples) - 9.81; // Subtract gravity (assuming Z is up)

  Serial.println("Calibration complete.");
}

void loop() {
  // Read MPU6050
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  data.accelX = a.acceleration.x - accelX_offset;
  data.accelY = a.acceleration.y - accelY_offset;
  data.accelZ = a.acceleration.z - accelZ_offset;

  // Read BMP180
  data.temperature = bmp.readTemperature();
  data.pressure = bmp.readPressure();
  data.altitude = bmp.readAltitude(SEA_LEVEL_PRESSURE_PA); // Use the local sea-level pressure for calculation

  // Read VEML7700
  data.lux = veml.readLux(VEML_LUX_AUTO);

  // Read GY-GPS6MV2
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      if (gps.location.isValid()) {
        data.latitude = gps.location.lat();
        data.longitude = gps.location.lng();
      } else {
        // If GPS is not valid, send 0.0 to indicate no fix
        data.latitude = 0.0;
        data.longitude = 0.0;
      }
    }
  }

  // Print all data to Serial Monitor
  Serial.println("--- Sensor Data ---");
  Serial.print("Accel X: "); Serial.print(data.accelX, 2); Serial.println(" m/s^2");
  Serial.print("Accel Y: "); Serial.print(data.accelY, 2); Serial.println(" m/s^2");
  Serial.print("Accel Z: "); Serial.print(data.accelZ, 2); Serial.println(" m/s^2");
  Serial.print("Temperature: "); Serial.print(data.temperature, 2); Serial.println(" °C");
  Serial.print("Pressure: "); Serial.print(data.pressure, 2); Serial.println(" Pa");
  Serial.print("Altitude: "); Serial.print(data.altitude, 2); Serial.println(" m");
  Serial.print("Light: "); Serial.print(data.lux, 2); Serial.println(" lux");
  Serial.print("Latitude: "); Serial.print(data.latitude, 6); Serial.println(" °");
  Serial.print("Longitude: "); Serial.print(data.longitude, 6); Serial.println(" °");
  Serial.println();

  // Split into packets
  Packet1 packet1 = {data.accelX, data.accelY, data.accelZ, data.temperature, data.pressure};
  Packet2 packet2 = {data.altitude, data.lux, data.latitude, data.longitude};

  // Transmit Packet1
  bool sent1 = radio.write(&PACKET1_ID, 1);
  sent1 &= radio.write(&packet1, sizeof(packet1));
  if (sent1) {
    Serial.println("Sent Packet1 successfully");
  } else {
    Serial.println("Failed to send Packet1");
  }

  delay(10); // Small delay for receiver to process

  // Transmit Packet2
  bool sent2 = radio.write(&PACKET2_ID, 1);
  sent2 &= radio.write(&packet2, sizeof(packet2));
  if (sent2) {
    Serial.println("Sent Packet2 successfully");
  } else {
    Serial.println("Failed to send Packet2");
  }

  // Send full packet via Serial to Processing GUI
  Serial.write(HEADER_BYTE); // Send header byte
  Serial.write((byte*)&data, sizeof(data)); // Send raw bytes of the struct

  delay(10); // Control transmission rate to 100 Hz
}`
  },
  {
    id: "GY_GPS_working",
    name: "GY_GPS_working",
    description: "",
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
  },
  {
    id: "MPU6050",
    name: "MPU6050",
    description: "",
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

  // Initialize MPU-6050
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) {
      delay(10);
    }
  }
  Serial.println("MPU6050 Found!");

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
    id: "MPU_wLED",
    name: "MPU_wLED",
    description: "",
    language: "cpp",
    filename: "MPU_wLED.ino",
    code: `#include <Wire.h>          // For I2C communication (how the Arduino talks to the sensor).
#include <Adafruit_MPU6050.h> // For the MPU6050 motion sensor itself.
#include <Adafruit_Sensor.h> // A helper book for many Adafruit sensors.
Adafruit_MPU6050 mpu;
const int LED_PIN = 2;

void setup() {
  Serial.begin(9600);
  while (!Serial) {
    delay(10);
  }

  // Initialize MPU-6050
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) {
      delay(10);
    }
  }
  Serial.println("MPU6050 Found!");
}

void loop() {
  sensors_event_t a, g, temp; // 'a' for acceleration.
  mpu.getEvent(&a, &g, &temp); // Get the latest information from the sensor.

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
    
  delay(2000); } // Wait a little bit (0.2 seconds) before checking again.
`
  },
  {
    id: "VEML7700_Easy",
    name: "VEML7700_Easy",
    description: "",
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
    id: "VEML_wLED",
    name: "VEML_wLED",
    description: "",
    language: "cpp",
    filename: "VEML_wLED.ino",
    code: `// We need a special instruction book to talk to our light sensor robot!
#include "Adafruit_VEML7700.h"

// Let's give our light sensor robot a name, "lightSensor".
Adafruit_VEML7700 veml = Adafruit_VEML7700();
const int LED_PIN = 2; // Tell the Arduino which pin the LED is connected to.

void setup() {
  // This is where our Arduino gets ready!
  Serial.begin(9600); // Start talking to the computer (chat window).
  pinMode(LED_PIN, OUTPUT); // Tell Arduino that this pin will control an LED (output light).
  if (!veml.begin()) {
  Serial.println("Could not find BMP180 sensor, check wiring!");
  while (1);
  }
}

void loop() {
  // This is what our Arduino does over and over again!

  // Ask the "lightSensor" robot how bright it is (the "lux" number).
  float lux = veml.readLux(VEML_LUX_AUTO);

  Serial.print("How bright is it? "); // Print a friendly message.
  Serial.print(lux);                  // Show the brightness number.
  Serial.println(" lux");             // Add " lux" and go to a new line.

  delay(1000); // Wait for 1 second before checking again.
}`
  },
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
        const pdfResponse = await fetch("http://localhost:8080/get-pdfs")
        if (!pdfResponse.ok) throw new Error("Failed to fetch PDFs")
        const pdfData: PDFFile[] = await pdfResponse.json()
        if (!isMounted) return
        setPdfs(pdfData)

        const progressResponse = await fetch(
          `http://localhost:8080/get-user-progress?user_id=${userId}&type=training_material`,
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
      const response = await fetch("http://localhost:8080/mark-progress", {
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
