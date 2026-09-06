import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractPdfText } from "@/lib/pdf";
import { generateQuiz } from "@/lib/quiz-generator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const titleValue = form.get("title");
    const title = typeof titleValue === "string" && titleValue.trim() ? titleValue.trim() : "Training Assessment";
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

    const generated = await generateQuiz(content, 5);
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

    return NextResponse.json({ id: quiz.id, source, extractedCharacters: content.length });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to create quiz.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
