import { GoogleGenAI } from "@google/genai";
import { generateMockQuiz, GeneratedQuestion } from "./quiz-mock";

const quizSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correctAnswer: { type: "integer", minimum: 0, maximum: 3 }
        },
        required: ["question", "options", "correctAnswer"]
      }
    }
  },
  required: ["questions"]
};

async function generateWithLLM(content: string, count: number): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert training assessment designer. Create exactly ${count} high-quality multiple-choice questions from the supplied syllabus and learner gap report.

Rules:
- Use the syllabus as the authoritative source for subject coverage.
- Use the learner gap report to prioritize topics with larger gaps.
- The gap report provides learner-level context; do not treat gap values as factual training content.
- Use only information supported by the supplied syllabus/context. Do not invent facts.
- Cover important concepts rather than trivial wording.
- Each question must have exactly 4 plausible options.
- correctAnswer is the zero-based index of the correct option.
- Avoid duplicate questions and ambiguous answers.
- Return exactly ${count} questions.
- Return only the requested JSON structure.

SUPPLIED SYLLABUS AND GAP REPORT:
${content}`;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: quizSchema }
    });
  } catch (error) {
    if (error instanceof Error && /503|UNAVAILABLE|high demand/i.test(error.message)) {
      throw new Error(`Gemini model '${model}' is temporarily unavailable (503). Try again later or choose another supported Gemini model.`);
    }
    throw error;
  }

  const raw = response.text?.trim();
  if (!raw) throw new Error("Gemini returned no structured output");

  const parsed = JSON.parse(raw) as { questions?: GeneratedQuestion[] };
  if (!Array.isArray(parsed.questions) || parsed.questions.length < count) {
    throw new Error(`Gemini returned fewer than the requested ${count} questions`);
  }

  const questions = parsed.questions.slice(0, count);
  for (const question of questions) {
    if (!question.question?.trim() || !Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error("Gemini returned an invalid question format");
    }
    if (!Number.isInteger(question.correctAnswer) || question.correctAnswer < 0 || question.correctAnswer > 3) {
      throw new Error("Gemini returned an invalid correct answer index");
    }
  }

  return questions.map((q) => ({
    question: q.question.trim(),
    options: q.options.map((option) => option.trim()),
    correctAnswer: q.correctAnswer
  }));
}

export async function generateQuiz(content: string, count = 5): Promise<GeneratedQuestion[]> {
  if (process.env.LLM_ENABLED === "true") {
    return generateWithLLM(content, count);
  }

  return generateMockQuiz(count);
}
