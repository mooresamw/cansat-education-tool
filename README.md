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
- **Python & Flask** (for backend development)
- **Firebase Account** (for authentication and database)
- **Docker** (for containerized deployment)

### Clone the Repository
```sh
$ git clone https://github.com/your-repo/cansat-education-tool.git
$ cd cansat-education-tool
```

### Install Dependencies
#### Frontend
```sh
$ cd client
$ npm install
$ npm run dev
```
#### Backend
```sh
$ cd server
$ pip install -r requirements.txt
$ python app.py
```

### Environment Variables
Create a `.env` file in the root directory and set the following:
```
FIREBASE_API_KEY=your_firebase_api_key
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

### Running the Application
- **Frontend**: Runs on `http://localhost:3000`
- **Backend**: Runs on `http://localhost:8080`

## License
This project is licensed under the **MIT License**.

