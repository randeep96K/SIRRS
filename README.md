# SIRRS — Interview Preparation Guide
**Smart Incident Reporting & Resolution System**

---

## 1. Project Overview (Elevator Pitch)

**SIRRS** is a full-stack MERN (MongoDB, Express, React, Node.js) web application designed for civic incident management. Citizens can report local infrastructure problems — potholes, water leaks, electricity outages, garbage — while government authorities get a dedicated dashboard to review, track, and resolve those reports.

**Core Value:** Bridges the gap between citizens and municipal authorities through a structured, location-aware, photo-supported incident workflow.

---

## 2. Tech Stack — What & Why

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | Fast SPA, component-based UI |
| Routing | React Router v6 | Client-side navigation, protected routes |
| HTTP Client | Axios | API calls with interceptor support |
| Maps | Leaflet + React-Leaflet | OpenStreetMap-based geo display |
| Backend | Node.js + Express 4 | RESTful API server |
| Database | MongoDB + Mongoose | Document storage, geospatial indexing |
| Auth | JWT (jsonwebtoken) + bcryptjs | Stateless auth, password hashing |
| File Upload | Multer | Disk-based image storage |
| Logging | Morgan | HTTP request logging |
| Email | Nodemailer | SMTP notifications (configured, optional) |
| Dev Tools | Nodemon, dotenv | Hot reload, env management |

---

## 3. Project Architecture

```
SIRRS/
├── backend/
│   ├── src/
│   │   ├── index.js            ← Express app entry point
│   │   ├── config/db.js        ← MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js         ← User schema (citizen/authority/admin)
│   │   │   └── Incident.js     ← Incident schema with GeoJSON
│   │   ├── controllers/
│   │   │   ├── authController.js    ← signup, login, getMe
│   │   │   └── incidentController.js ← CRUD + status + photos
│   │   ├── middleware/
│   │   │   ├── auth.js         ← JWT protect + role authorization
│   │   │   └── multer.js       ← File upload config
│   │   ├── routes/
│   │   │   ├── auth.js         ← /api/auth/*
│   │   │   └── incidents.js    ← /api/incidents/*
│   │   └── utils/
│   │       └── aiCategorizer.js ← Keyword-based auto-categorization
│   └── uploads/                ← Uploaded images stored here
└── frontend/
    ├── src/
    │   ├── App.jsx             ← Routes + ProtectedRoute wrapper
    │   ├── main.jsx            ← React DOM entry
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   └── IncidentCard.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── ReportForm.jsx        ← Map + photo + AI suggestion
    │   │   ├── MyReports.jsx         ← Citizen's own reports
    │   │   └── AuthorityDashboard.jsx ← Admin/authority view
    │   └── services/
    │       └── api.js          ← Axios instance + all API calls
    └── vite.config.js
```

---

## 4. Database Design

### User Schema (`User.js`)
```
name        String, required, maxlength 100
email       String, unique, required, regex validated
password    String, minlength 6, select: false (hidden by default)
role        Enum: ['citizen', 'authority', 'admin'], default: 'citizen'
phone       String (optional)
createdAt   Date
```
**Key design decisions:**
- `select: false` on password means it's never returned in queries unless explicitly asked with `.select('+password')`
- Password is hashed via a `pre('save')` Mongoose hook using bcrypt with salt rounds = 12
- `comparePassword()` is an instance method — keeps auth logic inside the model

### Incident Schema (`Incident.js`)
```
title           String, required, maxlength 200
description     String, required, maxlength 2000
category        Enum: ['road','water','electricity','waste','safety','other']
photos          [String]  (array of URL paths)
location        GeoJSON Point { type, coordinates: [lng, lat], address }
status          Enum: ['pending','acknowledged','in-progress','resolved','rejected']
reporter        ObjectId → ref: User
deadline        Date (optional)
timeline        [{ status, note, updatedBy(ref:User), timestamp }]
resolutionPhotos [String]
createdAt, updatedAt  Date
```
**Key design decisions:**
- `location` uses GeoJSON `Point` format with a `2dsphere` index for geospatial queries
- Coordinates are stored as `[longitude, latitude]` (GeoJSON order, opposite of lat/lng)
- `timeline` is an embedded array — each status change is appended as an audit log
- `resolutionPhotos` is separate from `photos` — keeps before/after evidence distinct
- `updatedAt` is auto-set in a `pre('save')` hook

---

## 5. API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register citizen/authority |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Private (any) | Get logged-in user profile |

### Incident Routes (`/api/incidents`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/incidents` | Private (any) | Create incident + upload photos |
| GET | `/api/incidents` | Private (any) | Get incidents (citizens see only their own) |
| GET | `/api/incidents/:id` | Private (any) | Get single incident |
| PATCH | `/api/incidents/:id/status` | Authority/Admin only | Update status + add timeline note |
| POST | `/api/incidents/:id/photos` | Authority/Admin only | Upload resolution photos |

---

## 6. Authentication & Authorization Flow

### JWT Flow:
1. User signs up or logs in → server verifies credentials → generates JWT signed with `JWT_SECRET`, expires in 7 days
2. Token returned to frontend → stored in `localStorage`
3. Every subsequent request: Axios interceptor reads token from `localStorage`, adds `Authorization: Bearer <token>` header
4. `protect` middleware on server: extracts token → `jwt.verify()` → attaches `req.user`
5. `authorizeRoles('authority', 'admin')` middleware checks `req.user.role`

### Role-Based Access Control (RBAC):
- **citizen**: Can create incidents, see only their own reports
- **authority**: Sees ALL incidents, can update statuses, upload resolution photos
- **admin**: Same as authority

### Security Considerations to Mention in Interview:
- Password not returned in API responses (`select: false`)
- bcrypt with 12 rounds is computationally expensive, making brute-force harder
- JWT is stateless — no session store needed
- Role guard is server-side — frontend routing is for UX only, not true security
- `.env` is committed (anti-pattern in real projects — mention this as an improvement area)

---

## 7. File Upload Design (Multer)

- **Storage**: `diskStorage` — files saved to `backend/uploads/` directory
- **Filename**: `fieldname-timestamp-random.ext` (e.g., `photos-1759309800735-672346095.jpg`) — prevents collisions
- **File filter**: Only allows `jpeg/jpg/png/gif/webp` by checking both `mimetype` and file extension
- **Size limit**: 5 MB per file
- **Max files**: 5 photos per request (set in route: `upload.array('photos', 5)`)
- **Static serving**: The uploads folder is served statically at `/uploads` — so frontend can use `/uploads/filename.jpg` directly

---

## 8. AI Auto-Categorizer (`aiCategorizer.js`)

This is a **keyword-scoring algorithm** (not an ML model) that suggests the incident category from the description text.

**How it works:**
1. Defines keyword arrays for each category (road, water, electricity, waste, safety)
2. Converts description to lowercase
3. Counts regex matches for every keyword across all categories
4. Returns the category with the highest score (minimum score 1 to avoid wild guesses)
5. Falls back to `'other'` if no keywords match

**Example:** If description contains "pothole" and "road crack", the `road` category gets score 2, which wins.

**In ReportForm:** Category dropdown defaults to `"-- Let AI Suggest --"`. If left blank, the backend calls `categorize(description)`. The AI suggestion is returned in the API response and shown to the user.

**Interview talking point:** "This is a rule-based NLP approach. For a production system, I could replace it with a real NLP model like TF-IDF classification or a fine-tuned LLM for better accuracy."

---

## 9. Frontend Architecture

### Routing & Protection (`App.jsx`)
- React Router v6 with `<BrowserRouter>`, `<Routes>`, `<Route>`
- `ProtectedRoute` component checks `localStorage` for `token` — if absent, redirects to `/login`
- Role-based redirect on login: `authority/admin → /dashboard`, `citizen → /my-reports`

### Axios Service Layer (`services/api.js`)
- Single Axios instance with `baseURL: http://localhost:5000/api`
- **Request interceptor**: Auto-attaches `Authorization` header from localStorage
- **Response interceptor**: On 401 → clears localStorage and redirects to `/login` (session expiry handling)
- All API calls are exported as named functions, keeping components clean

### Key Pages:

**ReportForm.jsx**
- Uses `navigator.geolocation.getCurrentPosition()` for GPS coordinates
- Integrates `react-leaflet` `MapContainer` to display the pinned location visually
- Generates local image previews with `URL.createObjectURL()` before upload
- Cleans up preview URLs with `URL.revokeObjectURL()` in a `useEffect` cleanup
- Sends multipart/form-data to backend (needed for file + JSON in one request)

**AuthorityDashboard.jsx**
- Split-panel layout: incident list on left, detail view on right
- Fetches incidents on mount and when filter changes (via `useEffect` dependency on `filter`)
- Status update sends `PATCH` to `/api/incidents/:id/status` with new status + note
- Timeline is displayed chronologically showing full audit history
- Resolution photo upload is separate from initial report photos

---

## 10. Geospatial Feature

- MongoDB `2dsphere` index on the `location` field enables geospatial queries
- GeoJSON `Point` format: `{ type: "Point", coordinates: [lng, lat] }` (note: longitude first)
- Frontend uses browser's `Geolocation API` to capture coordinates
- Leaflet renders an interactive map with an `OpenStreetMap` tile layer
- **Future enhancement**: MongoDB `$near` operator could find incidents within X km radius

---

## 11. Incident Lifecycle / Status Flow

```
CITIZEN REPORTS → [pending]
                     ↓
AUTHORITY REVIEWS → [acknowledged]
                     ↓
WORK BEGINS → [in-progress]
                     ↓
         ┌──────────────────┐
    [resolved]         [rejected]
```
Every transition adds an entry to the `timeline` array with timestamp, actor, and note — creating a full audit trail.

---

## 12. Likely Interview Questions & Strong Answers

**Q: How does JWT authentication work in your project?**
> On login, the server creates a JWT signed with a secret key. The frontend stores it in localStorage. For every API call, Axios attaches it as a Bearer token. The server's `protect` middleware verifies it — if valid, `req.user` is populated. If expired or invalid, a 401 is returned and the frontend clears storage and redirects to login.

**Q: How does role-based access control work?**
> Users have a `role` field (`citizen`, `authority`, `admin`). The `authorizeRoles()` middleware is a higher-order function that accepts allowed roles and checks `req.user.role`. For example, `authorizeRoles('authority', 'admin')` blocks citizens from updating statuses. Additionally, the `getIncidents` query automatically filters by `reporter: req.user.id` for citizens.

**Q: Why did you use MongoDB for this project?**
> Incidents have a variable number of photos, a dynamic timeline array, and nested GeoJSON location data. MongoDB's document model fits this naturally — no need for multiple JOIN tables. Also, MongoDB's native `2dsphere` geospatial index makes location-based queries straightforward.

**Q: Explain the file upload system.**
> Multer is configured with disk storage, saving files to an `uploads/` directory with timestamp-based unique filenames. Only image MIME types are accepted. The Express server serves this folder as static files at `/uploads`. Photo URLs (just the path strings) are stored in the database, not the binary data itself.

**Q: What is the AI categorizer doing exactly? Is it real AI?**
> It's a keyword-based scoring algorithm, not machine learning. It counts keyword matches per category and picks the highest-scoring one. I called it "AI" in the UI because it's automatic inference, but a true production system would use a trained classifier. The value here is the user experience — they don't have to manually categorize if they don't know what category to pick.

**Q: How did you handle the map integration?**
> I used `react-leaflet` with the OpenStreetMap tile layer, which is free and open-source. The browser's Geolocation API captures the coordinates. I pass them to MongoDB in GeoJSON format (longitude first per spec). On the UI, a `MapContainer` with a `Marker` shows the exact location — both in the report form and in the authority's detail view.

**Q: What would you improve in production?**
> Several things: (1) Move JWT to httpOnly cookies to prevent XSS. (2) Add refresh tokens. (3) Use cloud storage like AWS S3 instead of local disk for uploaded files. (4) Add input sanitization / rate limiting. (5) The `.env` file shouldn't be committed — use secrets management. (6) Add proper tests (currently none). (7) Replace the keyword categorizer with a trained NLP model. (8) Add WebSocket or polling for real-time status updates to citizens.

---

## 13. How to Run the Project

```bash
# Backend
cd backend
npm install
cp .env.example .env   # set MONGO_URI and JWT_SECRET
npm run dev            # runs on port 5000

# Frontend
cd frontend
npm install
npm run dev            # runs on port 5173 (Vite default)
```

---

## 14. Summary — What This Project Demonstrates

| Skill | Evidence |
|---|---|
| MERN Stack | Full-stack app with React + Node/Express + MongoDB |
| REST API Design | 8 endpoints with clear HTTP method semantics |
| JWT Auth + RBAC | protect middleware + authorizeRoles + role-based query filtering |
| File Handling | Multer disk storage + static serving + FormData on frontend |
| Geospatial Data | GeoJSON, 2dsphere index, Leaflet map, Geolocation API |
| Mongoose ODM | Schemas, virtuals, pre-save hooks, populate, indexing |
| React Patterns | useState, useEffect, controlled forms, protected routes, Axios interceptors |
| System Thinking | Audit trail (timeline), role separation, status lifecycle |
| NLP/Logic | Keyword-scoring AI categorizer |
