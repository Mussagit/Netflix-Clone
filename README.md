# 🎬 Netflix Clone — Full-Stack Monorepo

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-purple.svg)](https://vite.dev/)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-ISC-brightgreen.svg)]()

An enterprise-ready, production-grade Netflix full-stack streaming web application. Engineered with a decoupled **Frontend (React 19 + Vite)** and **Backend (Node.js + Express + MySQL + Google Gemini AI)** architecture, optimized for scalability, resilience, and 1-click cloud deployment.

---

## 🏗️ Professional Architecture Overview

```
Netflix-Clone/
├── backend/                       # RESTful API Service (Node.js / Express)
│   ├── config/
│   │   └── db.js                  # MySQL Connection Pool + Resilient Fallback Engine
│   ├── controllers/
│   │   ├── authController.js      # JWT Authentication, Registration, Profile Management
│   │   ├── movieController.js     # Gemini AI Recommendations & TMDB Proxy
│   │   └── watchlistController.js # Cloud Watchlist CRUD Operations
│   ├── middleware/
│   │   └── auth.js                # JWT Bearer Token Verification
│   ├── routes/
│   │   ├── authRoutes.js          # /api/users endpoints
│   │   ├── movieRoutes.js         # /api/movies endpoints
│   │   └── index.js               # Central API Router
│   ├── server.js                  # Express Entrypoint, Graceful Shutdown, CORS
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── frontend/                      # Client Application (React 19 / Vite / CSS Modules)
│   ├── src/
│   │   ├── assets/                # Optimized SVGs, Posters, Badges
│   │   ├── Components/            # Banner, Header, MovieCard, Modals, Sliders
│   │   ├── context/               # MovieContext & Authentication State
│   │   ├── Data/                  # Static Offline Fallbacks
│   │   ├── pages/                 # Home, Movies, TV, News, MyList, Login, 404
│   │   └── Utility/               # TMDB Axios Instance & Dynamic Request URLs
│   ├── public/
│   ├── index.html
│   ├── vite.config.js             # Vite Config with Dev API Proxy
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── vercel.json                    # Vercel Deployment Configuration
├── render.yaml                    # Render Infrastructure-as-Code Blueprint
├── package.json                   # Root Monorepo Orchestrator (Concurrent runner)
└── README.md                      # Documentation
```

---

## ✨ Features & Capabilities

### Frontend
- **Dynamic Hero Banner** — High-definition backdrop rotation with Play Trailer, More Info modal, and Watchlist toggle.
- **Multi-Category Sliders** — Parallel fetching across TMDB categories (Trending, Netflix Originals, Top Rated, Action, Romance, etc.) using `Promise.allSettled`.
- **Interactive Card Previews** — Hover zoom effect displaying match %, maturity ratings, dynamic genre pills, and quick action controls.
- **YouTube Trailer Modal** — Instant high-resolution trailer playback with YouTube iframe embed and cinematic fallbacks.
- **Movie Detail Modal** — Deep-dive modal revealing complete synopsis, cast, release dates, and related titles.
- **Live Search & Filter** — Instant TMDB search with debouncing and multi-language filtering.
- **Protected Routing** — Secured client routes requiring authentication, with seamless session persistence.

### Backend & Cloud Architecture
- **JWT Authentication** — BCrypt password hashing with signed JWTs (7-day validity).
- **Persistent Cloud Watchlist** — Synchronizes user watchlists between MySQL and local state.
- **Gemini AI Movie Recommendations** — Consumes user interaction history to generate intelligent suggestions via Google Gemini API, hydrated with live TMDB assets.
- **Dual Database Resilience** — Automatically detects local/cloud MySQL database daemon; seamlessly falls back to persistent JSON storage if MySQL is offline.
- **Production Server Readiness** — Environment-driven CORS, graceful shutdown handlers (`SIGTERM`, `SIGINT`), and standardized health checks.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- (Optional) **MySQL** server running locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Mussagit/Netflix-Clone.git
cd Netflix-Clone

# Install root, backend, and frontend dependencies in one command
npm run install:all
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=netflix_jwt_secret_key_2026_super_secure
TMDB_API_KEY=1d81816c92e2a6b1b532b8a8d7c53480
GEMINI_API_KEY=AIzaSyDummyGeminiKeyReplaceWithYoursIfAvailable

# MySQL Database (Optional - will use dynamic engine if MySQL is unavailable)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=netflix_db
DB_PORT=3306
```

**Frontend (`frontend/.env`):**
```env
VITE_TMDB_API_KEY=1d81816c92e2a6b1b532b8a8d7c53480
VITE_API_KEY=1d81816c92e2a6b1b532b8a8d7c53480
VITE_BACKEND_URL=http://localhost:5000/api
```

### 3. Launch Both Servers Concurrently
From the project root:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🚢 Production Deployment Guide

### Option A: Deploy on Vercel + Render (Recommended Free Setup)

1. **Deploy Backend on Render**:
   - Create a new **Web Service** on [Render](https://render.com).
   - Point to your repository and set the **Root Directory** to `backend`.
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Add environment variables (`JWT_SECRET`, `TMDB_API_KEY`, `NODE_ENV=production`).
   - Copy your deployed backend URL (e.g., `https://netflix-api.onrender.com`).

2. **Deploy Frontend on Vercel**:
   - Import your repository on [Vercel](https://vercel.com).
   - Set the **Root Directory** to `frontend`.
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add Environment Variable:
     - `VITE_BACKEND_URL`: `https://netflix-api.onrender.com/api`
     - `VITE_TMDB_API_KEY`: `your_tmdb_key`
   - Click **Deploy**!

---

### Option B: 1-Click Blueprint with `render.yaml`

This repository includes a [`render.yaml`](./render.yaml) file. On Render, select **Blueprints** and connect your repository to spin up both the backend web service and the static frontend automatically.

---

### Monorepo Scripts Reference

| Command | Action |
|---|---|
| `npm run dev` | Runs backend (5000) and frontend (5173) concurrently |
| `npm run dev:frontend` | Starts only the Vite frontend dev server |
| `npm run dev:backend` | Starts only the Express backend server with live reload |
| `npm run build` | Builds the optimized production bundle in `frontend/dist` |
| `npm run start` | Starts the production Node.js backend server |
| `npm run lint` | Runs oxlint across the codebase for static analysis |

---

## 🔒 Security Best Practices
- Passwords hashed with salted **BCrypt**.
- JWT session tokens transmitted via standardized **HTTP Bearer Authorization** headers.
- Permissive CORS restricted to trusted frontend domains in production.
- SQL injection prevention via parameterized queries throughout the relational engine.

---

## 📄 License
This project is open-source and available under the **ISC License**.
