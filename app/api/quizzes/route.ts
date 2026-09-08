import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractPdfText } from "@/lib/pdf";
import { generateQuiz } from "@/lib/quiz-generator";

export const runtime = "nodejs";

const DEFAULT_QUESTION_COUNT = 5;
const MAX_QUESTION_COUNT = 20;

type GapReportItem = {
  topic?: string;
  requiredLevel?: number;
  currentLevel?: number;
  gap?: number;
  [key: string]: unknown;
};

type QuizJsonRequest = {
  title?: string;
  syllabus?: unknown;
  gapReport?: GapReportItem[];
  questionCount?: number;
};

function parseQuestionCount(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return DEFAULT_QUESTION_COUNT;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > MAX_QUESTION_COUNT) return null;
  return count;
}

function buildJsonTrainingContent(syllabus: unknown, gapReport: GapReportItem[]): string {
  if (syllabus === undefined || syllabus === null) return "";

  return [
    "SYLLABUS:",
    JSON.stringify(syllabus, null, 2),
    "",
    "LEARNER GAP REPORT:",
    JSON.stringify(gapReport ?? [], null, 2),
    "",
    "GENERATION INSTRUCTION:",
    "Generate questions from the syllabus and use the gap report to prioritize topics with larger learning gaps. The gap report is context for question selection, not a source of facts."
  ].join("\n");
}

async function createQuiz(title: string, source: string, content: string, questionCount: number) {
  const generated = await generateQuiz(content, questionCount);
  const quiz = await prisma.quiz.create({
    data: {
      title,
      source,
      questions: {
        create: generated.map((q, order) => ({
          question: q.question,
          optionsJson: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          order
        }))
      }
    }
  });

  return NextResponse.json({
    id: quiz.id,
    source,
    questionCount: generated.length,
    extractedCharacters: content.length
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as QuizJsonRequest;
      const title = typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Training Assessment";
      const questionCount = parseQuestionCount(body.questionCount);

      if (questionCount === null) {
        return NextResponse.json(
          { error: `questionCount must be an integer between 1 and ${MAX_QUESTION_COUNT}.` },
          { status: 400 }
        );
      }

      if (body.syllabus === undefined || body.syllabus === null) {
        return NextResponse.json({ error: "JSON input must include syllabus." }, { status: 400 });
      }

      const gapReport = Array.isArray(body.gapReport) ? body.gapReport : [];
      const content = buildJsonTrainingContent(body.syllabus, gapReport);
      if (!content) {
        return NextResponse.json({ error: "Syllabus cannot be empty." }, { status: 400 });
      }

      return createQuiz(title, "server-json", content, questionCount);
    }

    const form = await request.formData();
    const titleValue = form.get("title");
    const title = typeof titleValue === "string" && titleValue.trim() ? titleValue.trim() : "Training Assessment";
    const questionCount = parseQuestionCount(form.get("questionCount"));

    if (questionCount === null) {
      return NextResponse.json(
        { error: `questionCount must be an integer between 1 and ${MAX_QUESTION_COUNT}.` },
        { status: 400 }
      );
    }

    const file = form.get("file");
    const pastedContent = form.get("content");

    let content = typeof pastedContent === "string" ? pastedContent.trim() : "";
    let source = "trainer-text";

    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
      }
      const maxBytes = Number(process.env.MAX_PDF_BYTES || 10 * 1024 * 1024);
      if (file.size > maxBytes) {
        return NextResponse.json({ error: `PDF is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.` }, { status: 400 });
      }
      content = await extractPdfText(file);
      source = "trainer-pdf";
    }

    if (!content) {
      return NextResponse.json({ error: "Upload a PDF or enter training content first." }, { status: 400 });
    }

    return createQuiz(title, source, content, questionCount);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to create quiz.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
