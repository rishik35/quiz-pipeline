import { generateMockQuiz, GeneratedQuestion } from "./quiz-mock";

const quizSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" }
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
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna";
  const prompt = `You are an expert training assessment designer. Create ${count} high-quality multiple-choice questions from the supplied training material.\n\nRules:\n- Use only information supported by the material. Do not invent facts.\n- Cover important concepts rather than trivial wording.\n- Each question must have exactly 4 plausible options.\n- correctAnswer is the zero-based index of the correct option.\n- Avoid duplicate questions and ambiguous answers.\n- Return only the requested structured data.\n\nTRAINING MATERIAL:\n${content}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "quiz_questions",
          description: "Multiple choice questions generated only from the training material.",
          strict: true,
          schema: quizSchema
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  const raw = typeof data.output_text === "string" ? data.output_text : "";
  if (!raw) throw new Error("OpenAI returned no structured output");

  const parsed = JSON.parse(raw) as { questions?: GeneratedQuestion[] };
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("OpenAI returned no questions");
  }

  return parsed.questions.slice(0, count).map((q) => ({
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
