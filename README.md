# StatKarmayogi Quiz Pipeline

Standalone prototype for the Rishik-owned SIH quiz flow.

## Flow
Trainer PDF → text extraction → AI MCQ generation → Quiz persistence → learner attempt → server-side score → QuizAttempt writeback.

## Run

```powershell
npm install
copy .env.example .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## AI setup

The trainer accepts PDF files up to 10 MB and extracts selectable text server-side. Set `OPENAI_API_KEY` in your local `.env` to enable AI generation. `OPENAI_MODEL` defaults to `gpt-5.6-luna` and can be changed without editing code. Keep the API key server-side and never commit `.env`.

If `LLM_ENABLED=true` but AI generation fails, the app logs the failure and falls back to the deterministic mock generator so the demo remains usable.

Scanned/image-only PDFs are not OCR'd yet; they return a clear extraction error instead of silently generating questions from missing text.

## Architecture
- Next.js + Prisma + SQLite
- PDF text extraction with pdf-parse
- Structured AI MCQ generation through the OpenAI Responses API
- Deterministic mock MCQ generator as fallback
- Server-side scoring and persisted QuizAttempt
- Auth intentionally excluded; integrate Auth.js/RBAC in the main StatKarmayogi app
- No live iGOT APIs
