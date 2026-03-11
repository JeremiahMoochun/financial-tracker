# ClearPath – Financial Tracker

Full-stack financial tracking web app with React frontend and Express backend.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Bootstrap
- **Backend:** Express + Node.js + TypeScript
- **Database:** MongoDB

## Getting Started

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 2. Backend (API server)
```bash
cd server
cp .env.example .env   # Edit if needed (MongoDB URL, JWT secret)
npm install
npm run dev
```
Server runs at **http://localhost:8080**

### 3. Frontend
```bash
# From project root
npm install
npm run dev
```
Frontend runs at **http://localhost:5173**

### 4. Register, Login, Logout
- Go to http://localhost:5173
- **Register** → create account
- **Login** → sign in (redirects to dashboard)
- **Logout** → sign out from navbar

## Project Structure
- `/src` – React frontend (pages, components, auth)
- `/server` – Express API (auth, transactions, debts)
- MongoDB stores users and session data
