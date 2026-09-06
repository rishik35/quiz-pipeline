"use client";
import { FormEvent, useState } from "react";

export default function UploadPage() {
  const [title, setTitle] = useState("Training Assessment");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!content.trim()) { setMessage("Enter training content first."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/quizzes", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ title, content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quiz");
      window.location.href = `/learner/quiz/${data.id}`;
    } catch (e) { setMessage(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  return <main className="container">
    <h1>Create Quiz</h1>
    <p className="muted">Paste training material. The prototype uses a deterministic mock generator and has an LLM adapter ready for integration.</p>
    <form className="card grid" onSubmit={submit}>
      <label>Quiz title<input type="text" value={title} onChange={e=>setTitle(e.target.value)} /></label>
      <label>Training content<textarea placeholder="Paste training material here..." value={content} onChange={e=>setContent(e.target.value)} /></label>
      {message && <p className="error">{message}</p>}
      <button className="btn" disabled={loading}>{loading ? "Generating..." : "Generate Quiz"}</button>
    </form>
  </main>;
}
