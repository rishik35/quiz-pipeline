"use client";
import { FormEvent, useState } from "react";

export default function UploadPage() {
  const [title, setTitle] = useState("Training Assessment");
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!file && !content.trim()) {
      setMessage("Upload a PDF or paste training content first.");
      return;
    }

    const form = new FormData();
    form.append("title", title);
    form.append("questionCount", String(questionCount));
    if (file) form.append("file", file);
    if (content.trim()) form.append("content", content);

    setLoading(true);
    try {
      const res = await fetch("/api/quizzes", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quiz");
      window.location.href = `/learner/quiz/${data.id}`;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>AI Trainer</h1>
      <p className="muted">Upload training material and choose how many AI-generated MCQs you want.</p>
      <form className="card grid" onSubmit={submit}>
        <label>
          Quiz title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label>
          Number of MCQs
          <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
          <span className="muted">Choose between 1 and 20 questions for server JSON requests.</span>
        </label>

        <label>
          Training PDF
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="muted">Maximum 10 MB. The PDF is processed for text extraction and is not stored in the database.</span>
        </label>

        {file && <p className="success">Selected: {file.name}</p>}

        <div className="divider"><span>or paste text</span></div>

        <label>
          Training content
          <textarea placeholder="Paste training material here if you don't have a PDF..." value={content} onChange={(e) => setContent(e.target.value)} />
        </label>

        {message && <p className="error">{message}</p>}
        <button className="btn" disabled={loading}>
          {loading ? "AI is generating your MCQs..." : "Generate AI Quiz"}
        </button>
      </form>
    </main>
  );
}
