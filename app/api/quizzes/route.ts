import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuiz } from "@/lib/quiz-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Training Assessment";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "Training content is required." }, { status: 400 });

    const generated = await generateQuiz(content, 5);
    const quiz = await prisma.quiz.create({
      data: {
        title, source: "trainer-upload",
        questions: { create: generated.map((q, order) => ({
          question: q.question, optionsJson: JSON.stringify(q.options), correctAnswer: q.correctAnswer, order
        })) }
      }
    });
    return NextResponse.json({ id: quiz.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create quiz." }, { status: 500 });
  }
}
