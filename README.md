# StatKarmayogi Quiz Pipeline

Standalone prototype for the Rishik-owned SIH quiz flow.

## Flow
Trainer content → MCQ generation → Quiz persistence → learner attempt → server-side score → QuizAttempt writeback.

## Run

```bash
npm install
copy .env.example .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Architecture
- Next.js + Prisma + SQLite
- Deterministic mock MCQ generator
- LLM adapter with deterministic fallback
- Server-side scoring and persisted QuizAttempt
- Auth intentionally excluded; integrate Auth.js/RBAC in the main StatKarmayogi app
- No live iGOT APIs
