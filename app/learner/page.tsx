import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function LearnerPage() {
  const quizzes = await prisma.quiz.findMany({ orderBy:{createdAt:"desc"}, include:{_count:{select:{questions:true}}} });
  return <main className="container"><h1>Learner Quizzes</h1><div className="grid">
    {quizzes.map(q=><div className="card" key={q.id}><h2>{q.title}</h2><p className="muted">{q._count.questions} questions</p><Link className="btn" href={`/learner/quiz/${q.id}`}>Start Quiz</Link></div>)}
    {!quizzes.length && <div className="card">No quizzes available.</div>}
  </div></main>;
}
