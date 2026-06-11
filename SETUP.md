# Speak-Up English — Local Setup

## 1. Google OAuth (required to login)

1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized JavaScript origins: `http://localhost:3000`
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**

Open `.env.local` and replace:
```
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
```

## 2. Run locally

```bash
cd /media/soares/Soares/luiz/interface
npm run dev
```

Open http://localhost:3000 — you'll land on the login page.

## 3. Project structure

```
src/
  app/
    login/         ← Login page (Google OAuth)
    (app)/
      dashboard/   ← Home dashboard
      books/       ← Book list + /books/[id] lesson view
      listenings/  ← Listening exercises
      quizes/      ← Quiz cards
  components/
    Navbar.tsx
    LessonView.tsx ← Accordion-based lesson display
    LessonsChart.tsx
  data/
    books.json     ← All book + lesson content (edit here)
    listenings.json
    quizes.json
    schedule.json
  lib/
    auth.ts        ← NextAuth config
    prisma.ts      ← DB client
prisma/
  schema.prisma    ← DB schema (Users, Sessions, Turmas, Schedules)
  dev.db           ← Local SQLite database
```

## 4. Adding content

All content lives in `src/data/books.json`. Each lesson follows this structure:
- `verbs` — array of {en, pt}
- `grammarPoints` — array of {en, pt}
- `practice` — string (oral drill description)
- `vocabulary` — array of {en, pt}
- `expressions` — array of {en, pt}
- `curiosity` — string
- `teachingGuide` — string (Portuguese, for teachers)
- `practicingPart2` — array of strings (substitution drills)
