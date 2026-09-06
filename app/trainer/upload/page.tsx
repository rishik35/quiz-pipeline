"use client";
import { FormEvent, useState } from "react";

export default function UploadPage() {
  const [title, setTitle] = useState("Training Assessment");
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
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
      <p className="muted">Upload a training PDF. The trainer extracts its text and uses the configured AI model to generate a quiz. If AI is unavailable, the deterministic demo generator is used.</p>
      <form className="card grid" onSubmit={submit}>
        <label>
          Quiz title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
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
          {loading ? "AI is reading the material..." : "Generate AI Quiz"}
        </button>
      </form>
    </main>
  );
}
