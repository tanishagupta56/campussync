# CampusSync Architecture & Deployment Guide

## Built Features
- Auth (OTP challenge, role check, session tokens) & Role-based routes
- Student Pages: Today, Announcements, Calendar, Deadlines, Attendance, Library, Lost & Found, Connect, Scholarships, Opportunities, Clubs, CampusSync AI
- Admin Area: Announcements CRUD, Event & Deadline creation, Library gate turnstiles, Scholarship soft-delete
- Faculty Dashboard: Academic notices, session scheduling, assignment deadlines, own subject attendance aggregates
- Club Core Dashboard: Manage assigned club info, host workshops/meets, broadcast society announcements

## Partly Built Features
- Database schemas & seed models exist for: Campus Issues
- Placeholder component exists for unmounted pages (`PlaceholderPage.tsx`)

## Not Built Yet
- Student Pages: Campus Issues
- Production email delivery (uses dev console / demo banner)
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

## UI Kit
- Shell: 72px left icon rail, floating rounded container on warm ivory, and 320px right info panel on dashboards.
- Design tokens: `--card-tint-1` to `--card-tint-4` (soft sage, mint, warm sand, blush) with borderless 22px cards.
- Shared components in `client/src/components/ui`: PageHeader, Chip, Card, Badge, Modal, EmptyState, LoadingSkeleton, StatCard, ProgressBar, MiniBarChart.
