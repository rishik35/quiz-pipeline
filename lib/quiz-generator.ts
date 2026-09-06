import { generateMockQuiz, GeneratedQuestion } from "./quiz-mock";

// Stable adapter: replace this function with the team's approved LLM provider later.
async function generateWithLLM(_content: string, _count: number): Promise<GeneratedQuestion[]> {
  throw new Error("LLM provider not configured");
}

export async function generateQuiz(content: string, count = 5): Promise<GeneratedQuestion[]> {
  try {
    if (process.env.LLM_ENABLED === "true") return await generateWithLLM(content, count);
  } catch {
    // Deterministic fallback keeps the demo working without an API.
  }
  return generateMockQuiz(count);
}
