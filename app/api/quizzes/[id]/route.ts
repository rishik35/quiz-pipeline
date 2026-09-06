import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  return NextResponse.json({
    id: quiz.id, title: quiz.title,
    questions: quiz.questions.map(q => ({ id: q.id, question: q.question, options: JSON.parse(q.optionsJson) }))
  });
}
