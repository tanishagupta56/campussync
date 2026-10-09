# CampusSync Architecture & Deployment Guide

## Built Features
- Auth (OTP challenge, role check, session tokens) & Role-based routes
- Student: Today, Announcements, Calendar, Deadlines, Attendance, Library, Lost & Found, Connect
- Admin Console: Notices CRUD, event creation, deadline post, gate turnstiles
- Express unified server serving Vite client bundle with API fallback

## Not Built Yet
- Opportunities, Scholarships, Clubs, CampusSync AI assistant
- Faculty and Club Core dashboards
- Production email delivery (uses dev console/demo banner)
- Three.js 3D library visualization

## Commands
- Local: `npm run db:start && npm run dev:server` (backend) / `npm run dev:client` (frontend)
- Render Build: `npm run build`
- Render Start: `npm run start`
- Render Seed: `npm run seed:base` (baseline accounts) / `npm run seed:demo` (sample posts)

## Required Environment Variables
- `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `DEV_SHOW_OTP`

## Golden Rules
1. Additive database migrations only; never edit old migrations.
2. Secrets strictly in environment variables; zero hardcoded fallback credentials in production.
3. Never run destructive seeds against production; baseline seeds must remain idempotent.
