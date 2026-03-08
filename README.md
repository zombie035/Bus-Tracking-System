
---

# 🚌 Smart Bus Tracking System

A **real-time smart bus tracking system** designed for **students and drivers** to monitor bus routes, stops, and live locations through an interactive map interface.

This project provides a **modern dashboard interface** where:

* Students can view the **live location of their bus**
* Drivers can **start and manage their routes**
* Bus stops are **highlighted on an interactive map**
* The system shows **distance and ETA**

The system uses **PostgreSQL as a local database**, **Google Maps/OpenStreetMap for map visualization**, and modern **web technologies** for the user interface.

---

# 📌 Project Overview

Many students face difficulty knowing **where their bus currently is** and **when it will arrive at their stop**.

This system solves that problem by providing:

* Real-time **bus location tracking**
* **Highlighted stops** on the route
* **Distance calculation** between student and bus
* **Route visualization**
* **ETA estimation**

The project includes **two dashboards**:

1. **Student Dashboard**
2. **Driver Dashboard**

---

# 🚀 Features

## 👨‍🎓 Student Dashboard

* View **live bus location**
* See **highlighted bus stops**
* View **route path**
* View **distance between bus and student**
* View **estimated arrival time**
* Switch **map views**
* Receive **notifications**
* Route visualization on map

---

## 🧑‍✈️ Driver Dashboard

* Start / Stop trip
* Update **live location**
* View **complete route**
* View **next stop**
* View **distance to next stop**
* Highlight stops on map

---

# 🗺 Map Features

The map system includes:

* Highlighted bus stops
* Complete route path
* Distance indicator
* Interactive stop details
* Student and bus markers

### Map Colors

| Element       | Color  |
| ------------- | ------ |
| Bus Route     | Blue   |
| Bus Location  | Red    |
| Stops         | Yellow |
| Distance Line | Green  |

---

# 🧰 Technology Stack

### Frontend

* HTML
* CSS
* JavaScript
* React (optional)
* Google Maps API / OpenStreetMap

### Backend

* Node.js
* Express.js

### Database

* **PostgreSQL (Local Storage Database)**

### APIs

* OSRM (Routing & ETA)
* OpenRouteService (optional)

---

# 🗄 Database (PostgreSQL)

This project uses **PostgreSQL as a local database** to store:

* Student data
* Driver data
* Bus routes
* Stops
* Bus location data

### Why PostgreSQL?

PostgreSQL provides:

* High performance
* Reliability
* Structured relational storage
* Support for geographic data

---

# 📂 Project Structure

```
Bus-Tracking-System
│
├── 📂 client                     # Frontend (React Application)
│   ├── 📂 public                 # Static files
│   │   └── 📂 images             # UI screenshots and assets
│   │
│   ├── 📂 src                    # Main frontend source code
│   │   ├── 📂 components         # Reusable UI components
│   │   │   ├── 📂 Admin
│   │   │   ├── 📂 Driver
│   │   │   ├── 📂 Student
│   │   │   ├── 📂 Auth
│   │   │   ├── 📂 Layout
│   │   │   ├── 📂 Common
│   │   │   └── 📂 UI
│   │   │
│   │   ├── 📂 contexts           # React Context providers
│   │   ├── 📂 hooks              # Custom React hooks
│   │   ├── 📂 pages              # Application pages
│   │   │   ├── 📂 Student
│   │   │   └── 📂 Driver
│   │   │
│   │   ├── 📂 services           # API calls & backend communication
│   │   ├── 📂 styles             # Global and component styles
│   │   ├── 📂 utils              # Helper functions
│   │   │
│   │   ├── App.jsx               # Root component
│   │   ├── index.jsx             # Entry point
│   │   └── routes.jsx            # App routing configuration
│   │
│   ├── package.json
│   └── tailwind.config.js
│
├── 📂 server                     # Backend (Node.js + Express)
│   ├── 📂 config                 # Database configuration
│   │
│   ├── 📂 controllers            # Business logic
│   │
│   ├── 📂 routes                 # API route definitions
│   │
│   ├── 📂 middleware             # Authentication & request middleware
│   │
│   ├── 📂 models                 # Database models
│   │
│   ├── 📂 services               # Backend services
│   │
│   ├── 📂 utils                  # Utility functions (ETA, routing, GPS)
│   │
│   ├── 📂 migrations             # Database schema updates
│   │
│   ├── 📂 uploads                # Uploaded files (notifications, docs)
│   │
│   ├── server.js                 # Backend server entry point
│   └── package.json
│
├── 📂 sample_images              # Screenshots for documentation
│   ├── admin-dashboard.png
│   ├── driver-dashboard.png
│   └── student-dashboard.png
│
├── 📜 .env                       # Environment variables
├── 📜 .gitignore
├── 📜 package.json
└── 📜 README.md
```

---

# 🛠 Installation Guide

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/bus-tracking-system.git
```

```
cd bus-tracking-system
```

---

# 📦 Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

---

# 🗄 PostgreSQL Database Setup

### Create Database

```sql
CREATE DATABASE bus_tracking;
```

---

### Create Tables

```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    stop_id INT
);
```

```
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    bus_id INT
);
```

```
CREATE TABLE stops (
    id SERIAL PRIMARY KEY,
    stop_name VARCHAR(100),
    latitude FLOAT,
    longitude FLOAT
);
```

```
CREATE TABLE buses (
    id SERIAL PRIMARY KEY,
    bus_number VARCHAR(50),
    driver_id INT
);
```

```
CREATE TABLE bus_location (
    id SERIAL PRIMARY KEY,
    bus_id INT,
    latitude FLOAT,
    longitude FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 🔗 Backend Server

Example **Express Server**

```javascript
const express = require("express")
const app = express()

app.use(express.json())

app.get("/", (req,res)=>{
    res.send("Bus Tracking System API Running")
})

app.listen(5000,()=>{
    console.log("Server running on port 5000")
})
```

---

# 🗺 Map Integration Example

Example code for displaying map.

```javascript
const map = new google.maps.Map(document.getElementById("map"), {
  zoom: 14,
  center: { lat: 13.0827, lng: 80.2707 }
});
```

---

# 📍 Display Bus Marker

```javascript
const marker = new google.maps.Marker({
  position: busLocation,
  map: map,
  title: "Bus Location"
});
```

---

# 📏 Distance Calculation

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = lat2-lat1;
  const dLon = lon2-lon1;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance;
}
```

---

# 🖥 Homepage Interface

The homepage contains:

* Project description
* Login interface
* Scrollable information sections

### Homepage Sections

1. Hero Section
2. Project Overview
3. Features
4. Login Section
5. Footer

---

# 🖼 Sample Screenshots

## Homepage


<table>
<tr>
<td>
<img src="https://github.com/user-attachments/assets/adfae4cb-4ce2-4877-987f-4297b8177172" width="100%"/>
</td>

<td>
<img src="https://github.com/user-attachments/assets/bf5b3a8d-2d19-40e5-a883-42df41ebd1d3" width="100%"/>
</td>
</tr>
</table>

---

## Admin Dashboard

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/56185477-f262-4fb9-920f-0e1c60340b36" width="100%"/></td>
<td><img  src="https://github.com/user-attachments/assets/d5b599a6-62f8-42d1-9ebe-5df095f1c986" width="100%" /></td>
</tr>

<tr>
<td><img src="https://github.com/user-attachments/assets/6b849213-1e77-4634-b481-38959f705f67" width="100%"/></td>
<td><img src="https://github.com/user-attachments/assets/9465232d-2710-4e86-bba4-4568a15c7212" width="100%"/></td>
</tr>
</table>

---

## Student Dashboard

<table>
<tr>
<td>
<img src="https://github.com/user-attachments/assets/bdf8e1d1-7cdc-4982-abd8-e6a66213e794" width="100%"/>
</td>

<td>
<img src="https://github.com/user-attachments/assets/aaceafb0-9433-4ecd-9742-9b097b30a7e5" width="100%"/>
</td>
</tr>
</table>

## Driver dashboard

<img width="1856" height="913" alt="image" src="https://github.com/user-attachments/assets/7c780640-2063-4ed1-b324-c417bb350a59" />


# ⚙ Running the Project

### Start Backend

```
cd server
node server.js
```

---

### Start Frontend

```
cd client
npm start
```

---

# 🌐 Access Application

```
http://localhost:3000
```

---

# 🔐 Authentication

The login system allows:

* Student login
* Driver login

Authentication verifies users using stored database records.

---

# 📡 APIs Used

### OSRM (Routing)

Used for:

* Route calculation
* ETA estimation
* Path generation

Example:

```
http://router.project-osrm.org/route/v1/driving/
```

---

# 🧠 Future Improvements

Possible future enhancements:

* Push notifications
* Mobile application
* Attendance tracking
* AI-based arrival prediction
* GPS hardware integration
* Offline support

---

# 🎯 Project Goal

The goal of this system is to:

* Improve **student convenience**
* Reduce **waiting time**
* Provide **transparent transportation tracking**
* Improve **bus route management**

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

Developed by

**SURENDRA PUROHIT**

---


