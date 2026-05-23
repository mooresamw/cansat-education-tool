# CanSat Education Tool

## Overview
The **CanSat Education Tool** is a web-based platform designed to provide students with hands-on learning experience in satellite and space engineering. The platform includes a **Virtual Arduino IDE**, real-time communication tools, and training materials to help students develop technical skills in a simulated CanSat environment.

## Features
- **Role-based Access**: Supports **Admins, Instructors, and Students**, each with specific functionalities.
- **Virtual Arduino IDE**: Enables interactive coding exercises and project development.
- **Real-Time Communication**: Live chat and messaging for seamless collaboration.
- **Project-Based Learning**: Resources such as training videos, assignments, and group collaboration.
- **Activity Tracking**: Tools for monitoring student progress and instructor work hours.

## Tech Stack
- **Frontend**: React.js / Next.js
- **Backend**: Flask
- **Database**: Firebase Firestore

## Installation & Setup
### Prerequisites
- **Node.js & npm** (for frontend development)  
- **Python3** (for backend development)  
- **Firebase Account** (for authentication and database)  

#### Nice to haves
- **Firebase CLI** (for Firestore and Storage)  
- **Vercel CLI** (for frontend deployment)  

### 1. Clone the Repository
```sh
$ git clone https://github.com/mooresamw/cansat-education-tool.git
$ cd cansat-education-tool
```

### 2. Install Dependencies
#### a. Frontend
Make sure you are in the `cansat-education-tool` directory and run:
```sh
$ npm install
```
#### b. Backend
Tip: You might want to open a second terminal window in your IDE

Make sure you are in the `cansat-education-tool` directory and run:
```sh
$ cd backend
$ pip install -r requirements.txt
$ python app.py ( to run backend backend )
```

### Environment Variables
Create a `.env` file (a file called `.env`) in the `cansat-education-tool` directory and set the following:
```
NEXT_PUBLIC_GOOGLE_API_KEY=<your_key>
FIREBASE_KEY=<your_key>
AUTH_DOMAIN=<your_key>
PROJECT_ID=<your_key>
STORAGE_BUCKET=<your_key>
MESSAGE_SENDER_ID=<your_key>
APP_ID=<your_key>
MEASUREMENT_ID=<your_key>
```

### Running the Application
1. **Frontend**: Runs on `http://localhost:3000`
```sh
$ npm run dev ( for dev backend )
```
2. **Backend**: Runs on `http://localhost:8080` 

Make sure you are in the `server` directory
```sh
$ python3 app.py
```

## License
This project is licensed under the **MIT License**.

