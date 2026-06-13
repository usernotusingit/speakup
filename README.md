This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## VM Deployment

The clone does **not** include environment files, the SQLite database, or the generated Prisma client — these are gitignored and must be created on the VM.

### 1. Clone and install

```bash
git clone https://github.com/usernotusingit/speakup.git
cd speakup
npm install
```

### 2. Create the environment file

Create `.env.production` in the project root (it is gitignored, so it never ships in the repo):

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="https://your-vm-domain-or-ip:3000"   # must match how the VM is reached
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
GOOGLE_CLIENT_ID="<your Google OAuth client id>"
GOOGLE_CLIENT_SECRET="<your Google OAuth client secret>"
TEACHER_EMAILS="lgnaves@gmail.com,joperudi@gmail.com"  # comma-separated teacher emails
ADMIN_EMAILS="joperudi@gmail.com"                     # comma-separated admin emails
```

### 3. Update the PM2 config

`ecosystem.config.js` has the working directory hardcoded — point it at the clone path on the VM:

```js
cwd: "/path/to/speakup",
```

### 4. Set up the database and build

```bash
npx prisma generate          # rebuilds src/generated/prisma (gitignored)
npx prisma migrate deploy    # creates dev.db and applies migrations
npm run build
```

### 5. Run

```bash
pm2 start ecosystem.config.js   # production (recommended)
# or
npm start
```

### 6. Google OAuth

In the Google Cloud Console, add the VM callback URL to the OAuth client's authorized redirect URIs, or sign-in will fail:

```
<NEXTAUTH_URL>/api/auth/callback/google
```

### Checklist of things to change per environment

- `NEXTAUTH_URL` — the VM's public address
- `ecosystem.config.js` → `cwd` — the clone path on the VM
- Google OAuth redirect URI in the Cloud Console

## Authentication

Auth uses NextAuth v5 (Google OAuth) with **database sessions** via the Prisma
adapter. Access control is enforced in two layers:

### Layer 1 — `src/proxy.ts` (route gate)

`src/proxy.ts` uses the Next.js 16 [`proxy`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
convention (the renamed, no-longer-deprecated `middleware`). It runs before any
route is rendered and **redirects unauthenticated page requests to `/login`**.

It performs an *optimistic* check only — it verifies the presence of the session
cookie, with **no database lookup** — so it stays cheap and runtime-safe. The
cookie name differs by transport:

- `authjs.session-token` — local dev over HTTP
- `__Secure-authjs.session-token` — production over HTTPS

The `matcher` excludes `/api/*`, Next internals/static assets, metadata files,
and `/login` (to avoid a redirect loop). **API routes are intentionally not
gated by the proxy** so they enforce their own auth and return JSON `401`/`403`
instead of an HTML redirect (e.g. `src/app/api/calendar/events/route.ts`).

> The proxy is a gate, not the source of truth. With database sessions it cannot
> validate the session itself (that needs a DB query) — it only checks the
> cookie exists. Do not rely on it for authorization decisions.

### Layer 2 — `(app)/layout.tsx` (authoritative check)

`src/app/(app)/layout.tsx` calls `await auth()`, which validates the session
against the database and redirects to `/login` if it's missing or invalid. This
is the real check; page-level guards (e.g. the teacher-only check in
`schedule/page.tsx`) build on top of it.

### Roles

Roles are derived from `TEACHER_EMAILS` (see [VM Deployment](#vm-deployment)) at
sign-in by `src/app/api/set-role/route.ts`, stored on the `User` record, and
surfaced on the session via the `session` callback in `src/lib/auth.ts`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
