# UNI Path — AI Student Progress Advisor

A real, responsive web app (phone · tablet · laptop) that helps university students in Kuwait
see what degree requirements remain, which courses they're eligible for next, and when they'll
graduate. Built to match the UNI Path design — fully bilingual (English + Arabic / RTL).

## Stack
- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Supabase** — Postgres + Auth + Row Level Security + Realtime + Storage
- **OpenRouter** — AI advisor chat (optional; falls back to a built-in advisor)

## Getting started
```bash
npm install
npm run dev          # http://localhost:3000
```
> In this workspace another dev server already used port 3000, so it was launched with
> `npm run dev -- --port 3007`. Use whichever port is free.

## Demo accounts (already created & email-confirmed)
| Role    | Email                   | Password      |
|---------|-------------------------|---------------|
| Student | `layla.m@coded.edu.kw`  | `password123` |
| Admin   | `admin@coded.edu.kw`    | `password123` |

The login screen also has an **"Explore the demo account"** button (logs in as Layla).

## Features
- **Auth** — email/password sign in & sign up (Supabase Auth)
- **Onboarding** — university/major → cohort → upload degree sheet (stored in Supabase Storage)
  → AI "parse" → mark completed courses
- **Dashboard** — credit progress, semester-by-semester timeline, requirement categories, eligible-next
- **My Plan** — eligible-now and locked courses with prerequisites
- **Grades & GPA** — editable grades that recalculate your real GPA live
- **AI Advisor** — chat scoped to your degree plan (OpenRouter, streamed)
- **Notifications** — in-app, live via Supabase Realtime
- **Notes & Reminders** — to-dos and a saved notepad
- **Admin** — user management table (search, filter, enable/disable) gated by role + RLS, with audit log

## Enabling real AI chat
The chat works out of the box with a built-in rule-based advisor. For real LLM answers, add an
[OpenRouter](https://openrouter.ai/keys) key to `.env.local`:
```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```
Then restart the dev server.

## New sign-ups & email confirmation
Supabase projects ship with **"Confirm email"** ON by default. With it on, a brand-new sign-up must
click an email link before signing in. To allow instant sign-ups during development, turn it off in
the Supabase dashboard → **Authentication → Providers → Email → "Confirm email"**.
The two demo accounts above are pre-confirmed and work either way.

## Project layout
```
src/
  app/
    login/                 auth (login + signup)
    onboarding/            5-step setup wizard
    (app)/                 authenticated shell + screens
      dashboard, courses, grades, resources, notes, chat, upload, notifications, admin
    api/chat/route.ts      OpenRouter streaming endpoint (+ fallback)
  components/              AppShell, shared UI
  lib/
    supabase/              browser + server clients
    auth.tsx               session + profile context
    data.tsx               per-user data + Realtime
    i18n.tsx               EN/AR dictionary + RTL
    catalog.ts             course catalogs, plan & GPA math
    content.ts             illustrative course/resource content
  proxy.ts                 Next 16 session-refresh (formerly middleware)
```
