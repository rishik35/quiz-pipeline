import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const learnerId = typeof body.learnerId === "string" && body.learnerId.trim() ? body.learnerId.trim() : "demo-learner";
    const answers = body.answers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers are required." }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: true } });
    if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

    let score = 0;
    for (const q of quiz.questions) {
      const selected = answers[q.id];
      if (Number.isInteger(selected) && selected === q.correctAnswer) score++;
    }
    const total = quiz.questions.length;
    const percentage = total ? (score / total) * 100 : 0;
    const attempt = await prisma.quizAttempt.create({ data: { quizId: id, learnerId, score, total, percentage } });
    return NextResponse.json({ attemptId: attempt.id, score, total, percentage });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to submit quiz." }, { status: 500 });
  }
}
