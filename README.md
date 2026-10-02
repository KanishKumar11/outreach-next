# LinkedIn Outreach Tracker (Next.js + MongoDB)

Team tool for LinkedIn outreach: prospects with an automatic follow-up cadence, a calendar (month / week / day),
login with roles, user management, permissions and profiles. Ported from the claude.ai artifact version with the
same screens, styling and behaviour. Login and storage now run on your own server and MongoDB.

## Stack
Next.js 14 (App Router, JavaScript) · MongoDB (official driver) · `jose` (signed session cookie) · `bcryptjs` (password hashing)

## Setup
1. Requirements: Node 20.6+ and a MongoDB database (MongoDB Atlas free tier works).
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in:
   - `MONGODB_URI`, `MONGODB_DB`
   - `AUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` (your first Super Admin)
4. `npm run seed` creates indexes and the Super Admin. Run it once.
5. `npm run dev`, open http://localhost:3000 and sign in.

## Deploy (Vercel)
Import the repo, add `MONGODB_URI`, `MONGODB_DB` and `AUTH_SECRET` as environment variables, and deploy.
In Atlas, allow Vercel's IPs under Network Access (or `0.0.0.0/0` for a quick start). Run `npm run seed` once from your own machine.

## Roles and access
- **Super Admin**: everything, plus the Team tab (create users with username, password and role; approve or reject
  access requests; activate, deactivate, remove; reset passwords; edit the permission matrix).
- **Admin / Manager / Member**: the permission matrix in Team → Permissions decides who can create/edit/delete events,
  add/edit/delete prospects and export CSV. Defaults are in `lib/perms.js`.
- **Request access** on the sign-in screen creates a pending Member. It cannot sign in until a Super Admin approves it.
- Every request re-checks the user in the database, so deactivation and role changes apply immediately.
- Users can change their own password and photo from the profile panel.

## MongoDB collections
| Collection | Fields |
|---|---|
| `users` | username (unique), name, role, status (active / inactive / pending / rejected), passHash, avatar, createdAt |
| `prospects` | name, company, title, owner, url, status, notes, meeting, followUpAt, demoAt, reminderAt, meetingConfirmed, followUps, lastActionDate, createdAt, createdBy |
| `events` | title, type, start, pid (prospect id), notes, by |
| `settings` | `_id: "perms"`, value (permission overrides per role) |

## Project layout
- `app/components/` UI: `Workspace` (data loading, tabs), `Calendar`, `Prospects`, `Team`, `Profile`, `Login`
- `app/api/` REST routes: `auth/*`, `prospects`, `events`, `users`, `perms`, `profile`
- `lib/cadence.js` statuses, follow-up cadence and calendar activity builder (edit the timings here)
- `lib/perms.js` roles and default permissions · `lib/auth.js` sessions and permission guards
- `scripts/seed.mjs` first-run setup

## Notes
- Data refreshes every 15 seconds (polling), not instantly like the claude.ai version.
- The login rate limiter is in memory per server instance; add Redis or similar if you run many instances.
- No sample data is included. Data from the claude.ai version is not migrated automatically.
