# CampusSync — University Campus Management & Student Experience Platform

CampusSync is a full-stack university campus management and student experience platform connecting **Students, Faculty, Administrators, and Club Core** users through a unified PostgreSQL database, Express REST API, and a React + TypeScript frontend with Three.js visualizations.

---

## 1. Quick Start

### Prerequisites
- Node.js LTS (v20+ or v24+)
- Git

### Installation
```bash
# Clone or navigate to the repository
cd campussync

# Install all dependencies (root, backend, and frontend)
npm run install:all
```

---

## 2. Managing the Database (Hidden Background Process)

CampusSync includes a self-contained portable PostgreSQL server managed automatically via scripts using hidden background execution without opening extra terminal windows.

### Starting PostgreSQL
To start the database in the background (detached, hidden window, listening on port `5432`):
```bash
npm run db:start
```
*Note: This command runs in a hidden process, checks port `5432`, verifies database `campussync`, and exits immediately while keeping PostgreSQL running silently in the background.*

### Stopping PostgreSQL
To cleanly shut down the background PostgreSQL server:
```bash
npm run db:stop
```

### Seeding Demo Data
To reset or re-seed the PostgreSQL database with realistic Indian university demo data:
```bash
npm run db:seed
```

---

## 3. Running the Application

### Development Servers

#### Terminal 1: Backend API (Express on port 5000)
```bash
npm run dev:server
```

#### Terminal 2: Frontend Client (Vite on port 5173)
```bash
npm run dev:client
```

Access the application in your browser at: `http://localhost:5173`

---

## 4. Demo Accounts & Credentials

All demo accounts come seeded with pre-configured timetables, attendance history, announcements, and permissions:

| Role | Email | Password | Context |
|---|---|---|---|
| **Student** | `aarav.sharma@campus.edu` | `Student@123` | B.Tech CSE (3rd Sem, 2nd Year), enrollments, timetable, active attendance records |
| **Student (Mentor)** | `priya.patel@campus.edu` | `Student@123` | B.Tech CSE (5th Sem, 3rd Year), opted-in mentor, scholarship awardee |
| **Faculty** | `dr.ramanujan@campus.edu` | `Faculty@123` | Dept of Computer Science & Engineering, course instructor CS301 |
| **Administrator** | `admin@campus.edu` | `Admin@123` | Central Administration & Registrar Office, manages library & issues |
| **Club Core** | `robotics.lead@campus.edu` | `Club@123` | Robotics & Automation Society Lead (signs in via `/club-login`) |

---

## 5. Authentication Flow & OTP Verification

1. **Step 1:** Select role (**Student**, **Faculty**, or **Administrator**). Club Core users sign in via the dedicated `/club-login` route.
2. **Step 2:** Enter registered college email and password.
3. **Step 3 (Email OTP):** The backend validates that:
   - The user exists
   - The password is correct
   - **The selected role strictly matches the user's role in the database** (mismatches fail immediately with a safe error).
   - If valid, a cryptographically secure 6-digit OTP is generated, hashed with SHA-256, and stored in `OtpChallenge` with a 10-minute expiry and max 5 attempts.
4. **Development OTP Fallback:**
   - If `EMAIL_API_KEY` is not set in `.env`, the 6-digit OTP is automatically printed to the server console log for instant testing.
5. **Session:** Session token is issued via secure `httpOnly` cookie only after OTP verification.

---

## 6. Environment Variables

Create `.env` inside `server/` (copied from `.env.example`):

```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DEFAULT_TIMEZONE=Asia/Kolkata

# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/campussync?schema=public"

# Auth Secrets
JWT_SECRET=campussync-super-secret-jwt-key-2026-very-secure
SESSION_SECRET=campussync-super-secret-session-key-2026

# Email Provider (Optional in development - OTP prints to console if empty)
EMAIL_API_KEY=
EMAIL_FROM=noreply@campus.edu

# OpenAI API Key (for CampusSync AI RAG Assistant)
OPENAI_API_KEY=
```

---

## 7. Project Architecture

```
campussync/
├── server/
│   ├── prisma/             # Schema (25+ models) and seed scripts
│   ├── src/
│   │   ├── config/         # Environment & timezone configurations
│   │   ├── controllers/    # Request handlers for auth, attendance, library, etc.
│   │   ├── middlewares/    # Auth token check, role guards, rate limiting, error handler
│   │   ├── routes/         # Express REST API route definitions
│   │   ├── services/       # Business logic (OTP hashing, attendance calculations, AI RAG)
│   │   └── utils/          # Date & timezone utilities (Asia/Kolkata default)
│   ├── start-db.js         # Detached hidden background PostgreSQL starter
│   └── stop-db.js          # Clean PostgreSQL shutdown script
│
└── client/
    ├── src/
    │   ├── components/     # UI components (Shell, Sidebar, Modals, Badges, 3D Canvas)
    │   ├── context/        # AuthContext, ToastContext
    │   ├── lib/            # Axios API client, TanStack Query client, date utilities
    │   ├── pages/          # Student, Faculty, Admin, Club, and Auth pages
    │   └── types/          # Shared TypeScript interfaces
    └── tailwind.config.js  # CampusSync custom design tokens (Ivory, Sage, Jade, Charcoal)
```
