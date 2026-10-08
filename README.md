# T.O. Clinic — AI Receptionist Dashboard

Premium operations dashboard for **T.O. Clinic** (Orthopaedic and Trauma), Gulshan-e-Iqbal, Karachi.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + Lucide + Framer Motion
- Prisma + SQLite
- OmniDimension post-call webhook integration

## Getting started

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
OmniDimension AI receptionist (agent 264841)
  → webhook POST /api/webhooks/omnidimension
  → Prisma / SQLite
  → /api/dashboard | /api/appointments | /api/calls | /api/activity
  → Dashboard UI
```

See [OMNIDIMENSION.md](./OMNIDIMENSION.md) for webhook setup and required secrets.

## Environment

Server-side only (never `NEXT_PUBLIC_*`):

- `DATABASE_URL`
- `OMNIDIMENSION_API_KEY`
- `OMNIDIMENSION_AGENT_ID` (default `264841`)
- `OMNIDIMENSION_WEBHOOK_SECRET`

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run db:migrate` — apply migrations
- `npm run db:seed` — seed clinic doctors only (no fake patients/calls)

## Notes

- The UI shows real database values only. Empty clinic = empty states / zeros.
- Transcripts come from OmniDimension call payloads; nothing is invented in the frontend.
- Configure the agent’s post-call webhook to this app’s `/api/webhooks/omnidimension` URL and include `fullConversation`.
