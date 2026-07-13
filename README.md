# 🏢 ApartIS – Smart Apartment Management System

> A modern, real-time apartment management platform built with the MERN stack to simplify communication, complaint management, maintenance tracking, and community operations.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black?logo=socketdotio)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🚀 Overview

ApartIS is a comprehensive apartment management platform that digitizes day-to-day residential operations by providing a centralized system for residents and administrators.

The application enables secure authentication, complaint registration, real-time maintenance updates, apartment ledger management, and instant notifications using WebSockets.

Designed with scalability and usability in mind, ApartIS delivers a seamless experience for both apartment residents and management committees.

---

## ✨ Key Features

### 👤 Authentication
- Secure Login & Registration
- JWT Authentication
- Role-based Access (Admin & Resident)

### 🏠 Resident Dashboard
- Personalized Dashboard
- Apartment Information
- Real-time Updates
- Complaint History

### 📢 Complaint Management
- Raise Maintenance Complaints
- Track Complaint Status
- View Complaint Timeline
- Admin Complaint Resolution

### 💰 Apartment Ledger
- View Monthly Payments
- Maintenance Charges
- Payment Status
- Transaction Records

### ⚡ Real-Time Communication
- Socket.IO Integration
- Live Complaint Updates
- Instant Notifications
- Real-time Dashboard Refresh

### 🛡️ Admin Panel
- Complaint Monitoring
- Resident Management
- Dashboard Analytics
- Complaint Status Updates

---

# 🖥️ Tech Stack

## Frontend
- React.js
- Vite
- React Router
- Axios
- Socket.IO Client
- CSS3

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication
- bcrypt.js

---

# 📂 Project Structure

```
ApartIS
│
├── Client
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.js
│
├── Server
│   ├── server.js
│   ├── seedData.js
│   ├── package.json
│   ├── models
│   ├── routes
│   ├── middleware
│   └── controllers
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/madhavkn11/ApartIS---Smart-Apartment-Management-System.git

cd ApartIS---Smart-Apartment-Management-System
```

---

## Install Dependencies

### Frontend

```bash
cd Client
npm install
```

### Backend

```bash
cd Server
npm install
```

---

## Environment Variables

Create a `.env` file inside **Server**

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

---

## Seed Sample Data

```bash
cd Server
node seedData.js
```

---

## Start Backend

```bash
npm start
```

or

```bash
npm run dev
```

---

## Start Frontend

```bash
cd Client
npm run dev
```

---

# 📸 Screenshots



---

# 🔄 Application Workflow

```text
Resident Login
       │
       ▼
 Resident Dashboard
       │
       ├───────────────► Complaint Module
       │                     │
       │                     ▼
       │              Socket.IO Server
       │                     │
       ▼                     ▼
Apartment Ledger      Admin Dashboard
       │                     │
       └──────────────► Real-Time Updates
```

---

# 🎯 Future Enhancements

- Payment Gateway Integration
- Visitor Management
- Facility Booking
- Notice Board
- Maintenance Scheduling
- AI Complaint Categorization
- Email Notifications
- Mobile Application
- Cloud Deployment

---

# 📈 Project Highlights

✔ Full Stack MERN Architecture

✔ JWT Authentication

✔ MongoDB Integration

✔ RESTful APIs

✔ Socket.IO Real-Time Communication

✔ Responsive UI

✔ Complaint Tracking System

✔ Apartment Ledger Management

✔ Role-Based Authorization

✔ Production Ready Architecture

---


---

# 👨‍💻 Developer

**Madhav Karthik Nambi**

GitHub: https://github.com/madhavkn11

---
