"use client";
import { useEffect, useState } from "react";

type Quiz = { id:string; title:string; questions:{id:string;question:string;options:string[]}[] };
export default function QuizClient({id}:{id:string}) {
  const [quiz,setQuiz]=useState<Quiz|null>(null); const [answers,setAnswers]=useState<Record<string,number>>({});
  const [result,setResult]=useState<{score:number;total:number;percentage:number}|null>(null); const [error,setError]=useState(""); const [submitting,setSubmitting]=useState(false);
  useEffect(()=>{ fetch(`/api/quizzes/${id}`).then(async r=>{const d=await r.json(); if(!r.ok) throw new Error(d.error||"Quiz not found"); setQuiz(d);}).catch(e=>setError(e.message)); },[id]);
  async function submit(){
    if(!quiz) return; setSubmitting(true); setError("");
    try { const r=await fetch(`/api/quizzes/${id}/attempt`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({learnerId:"demo-learner",answers})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Submission failed"); setResult(d); }
    catch(e){setError(e instanceof Error?e.message:"Submission failed");} finally{setSubmitting(false);}
  }
  if(error) return <main className="container"><p className="error">{error}</p></main>;
  if(!quiz) return <main className="container"><p>Loading quiz...</p></main>;
  if(result) return <main className="container"><div className="card"><h1>{quiz.title}</h1><p className="result">Score: {result.score} / {result.total}</p><p className="result">{result.percentage.toFixed(0)}%</p><p className="success">Attempt saved successfully.</p><a className="btn" href="/learner">Back to Quizzes</a></div></main>;
  return <main className="container"><h1>{quiz.title}</h1>{quiz.questions.map((q,i)=><section className="card" key={q.id}><h2>{i+1}. {q.question}</h2>{q.options.map((o,n)=><label className="option" key={n}><input type="radio" name={q.id} checked={answers[q.id]===n} onChange={()=>setAnswers(a=>({...a,[q.id]:n}))}/> {o}</label>)}</section>)}<button className="btn" disabled={submitting} onClick={submit}>{submitting?"Submitting...":"Submit Quiz"}</button></main>;
}
