import Link from "next/link";

export default function Home() {
  return <main className="container">
    <h1>StatKarmayogi Quiz Pipeline</h1>
    <p className="muted">Trainer content → MCQs → learner attempt → server-side score writeback.</p>
    <div className="card grid">
      <Link className="btn" href="/trainer/upload">Trainer: Create Quiz</Link>
      <Link className="btn secondary" href="/learner">Learner: View Quizzes</Link>
    </div>
  </main>;
}
