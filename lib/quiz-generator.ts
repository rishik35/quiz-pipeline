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
          options: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4
          },
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

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert training assessment designer. Create exactly ${count} high-quality multiple-choice questions from the supplied training material.

Rules:
- Use only information supported by the material. Do not invent facts.
- Cover important concepts rather than trivial wording.
- Each question must have exactly 4 plausible options.
- correctAnswer is the zero-based index of the correct option.
- Avoid duplicate questions and ambiguous answers.
- Return only the requested JSON structure.

TRAINING MATERIAL:
${content}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: quizSchema
    }
  });

  const raw = response.text?.trim();
  if (!raw) throw new Error("Gemini returned no structured output");

  const parsed = JSON.parse(raw) as { questions?: GeneratedQuestion[] };
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Gemini returned no questions");
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
    try {
      return await generateWithLLM(content, count);
    } catch (error) {
      console.error("AI generation failed; using deterministic fallback:", error);
    }
  }
  return generateMockQuiz(count);
}
