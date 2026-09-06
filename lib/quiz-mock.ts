export type GeneratedQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
};

const fallbackQuestions: GeneratedQuestion[] = [
  { question: "What is the median of the ordered values 2, 4, 7, 9, 12?", options: ["4", "7", "9", "12"], correctAnswer: 1 },
  { question: "Which measure is calculated by adding all observations and dividing by their count?", options: ["Mean", "Median", "Mode", "Range"], correctAnswer: 0 },
  { question: "Which visualization is commonly used to show change across time?", options: ["Line chart", "Pie chart", "Single-value card", "Word list"], correctAnswer: 0 },
  { question: "If 25 out of 100 learners pass, what is the pass percentage?", options: ["10%", "20%", "25%", "40%"], correctAnswer: 2 },
  { question: "What does a dataset's range describe?", options: ["The largest value minus the smallest value", "The average value", "The most frequent value", "The middle value"], correctAnswer: 0 }
];

export function generateMockQuiz(count = 5): GeneratedQuestion[] {
  return Array.from({ length: count }, (_, i) => fallbackQuestions[i % fallbackQuestions.length]);
}
