
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const QUESTION_LIMIT = 12;
const MCQ_LIMIT = 6;
const DESCRIPTIVE_LIMIT = 6;

const generateInterviewQuestions = async ({
  targetRole,
  experience,
  targetCompany,
  jobDescription,
  interviewTypes,
  difficulty,
  resumeText,
}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = `
You are an experienced interviewer. Generate exactly 12 interview questions.

Candidate details:
- Target role: ${targetRole || "Software Developer"}
- Experience: ${experience || "Not specified"}
- Target company: ${targetCompany || "Not specified"}
- Interview types: ${
    Array.isArray(interviewTypes) && interviewTypes.length
      ? interviewTypes.join(", ")
      : "Technical and HR"
  }
- Difficulty: ${difficulty || "Medium"}
- Job description: ${(jobDescription || "Not provided").slice(0, 4000)}
- Resume: ${(resumeText || "Not provided").slice(0, 5000)}

Return exactly 6 MCQ questions and 6 Descriptive questions.
Mix both types throughout the list.

IMPORTANT TYPE RULES:

MCQ:
- Ask a question that can be answered by selecting ONE option.
- Include exactly four distinct options.
- correctOption must be an integer from 0 to 3.
- expectedPoints must explain the correct answer.
- Do not use MCQ for questions asking the candidate to explain,
  describe, discuss, compare, implement, or give an example in detail.

Descriptive:
- Use prompts such as "Explain", "Describe", "How would you...",
  "Discuss", or "Give an example".
- type must be exactly "Descriptive".
- options must be [].
- correctOption must be null.
- expectedPoints must contain 2 to 4 key points for a good answer.

All questions:
- Match the candidate's role and preparation details.
- Do not invent candidate qualifications.
- difficulty must be Easy, Medium, or Hard.
- Return valid JSON only. Do not include Markdown fences.

JSON structure:
{
  "questions": [
    {
      "question": "Which method creates a new array?",
      "topic": "JavaScript",
      "difficulty": "Easy",
      "type": "MCQ",
      "options": ["map()", "forEach()", "push()", "pop()"],
      "correctOption": 0,
      "expectedPoints": ["map() creates a new array."]
    },
    {
      "question": "Explain how the JavaScript event loop works.",
      "topic": "JavaScript",
      "difficulty": "Medium",
      "type": "Descriptive",
      "options": [],
      "correctOption": null,
      "expectedPoints": [
        "Explain the call stack.",
        "Explain microtasks and promises.",
        "Explain when macrotasks run."
      ]
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      maxOutputTokens: 6000,
    },
  });

  const responseText = response.text;

  if (!responseText || !responseText.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsedResponse;

  try {
    const cleanedText = responseText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    parsedResponse = JSON.parse(cleanedText);
  } catch {
    throw new Error(
      "Gemini returned invalid or incomplete JSON. Please try again."
    );
  }

  if (
    !parsedResponse ||
    !Array.isArray(parsedResponse.questions) ||
    parsedResponse.questions.length !== QUESTION_LIMIT
  ) {
    throw new Error(
      `Gemini must return exactly ${QUESTION_LIMIT} questions.`
    );
  }

  const questions = parsedResponse.questions.map((item) => {
    const rawType =
      typeof item.type === "string"
        ? item.type.trim().toLowerCase()
        : "";

    const type =
      rawType === "mcq"
        ? "MCQ"
        : rawType === "descriptive"
          ? "Descriptive"
          : "";

    const options = Array.isArray(item.options)
      ? item.options
          .filter((option) => typeof option === "string")
          .map((option) => option.trim())
          .filter(Boolean)
      : [];

    const expectedPoints = Array.isArray(item.expectedPoints)
      ? item.expectedPoints
          .filter(
            (point) =>
              typeof point === "string" && point.trim()
          )
          .map((point) => point.trim())
      : [];

    return {
      question:
        typeof item.question === "string"
          ? item.question.trim()
          : "",
      topic:
        typeof item.topic === "string" && item.topic.trim()
          ? item.topic.trim()
          : "General",
      difficulty: ["Easy", "Medium", "Hard"].includes(
        item.difficulty
      )
        ? item.difficulty
        : difficulty || "Medium",
      type,
      options,
      correctOption: item.correctOption,
      expectedPoints,
    };
  });

  for (const question of questions) {
    if (!question.question || !question.type) {
      throw new Error(
        "A generated question has missing text or an invalid type. Regenerate the questions."
      );
    }

    // Detect common mismatches between question wording and type.
    const asksForAnExplanation =
      /^(explain|describe|discuss|elaborate|how would you|how do you|walk me through|give an example|tell me about)\b/i.test(
        question.question.trim()
      );

    if (question.type === "MCQ") {
      if (asksForAnExplanation) {
        throw new Error(
          `Question type mismatch: "${question.question}" is descriptive in wording but was labelled MCQ. Please regenerate the questions.`
        );
      }

      if (
        question.options.length !== 4 ||
        new Set(
          question.options.map((option) => option.toLowerCase())
        ).size !== 4
      ) {
        throw new Error(
          "Every MCQ must contain exactly four distinct options. Please regenerate."
        );
      }

      if (
        !Number.isInteger(question.correctOption) ||
        question.correctOption < 0 ||
        question.correctOption > 3
      ) {
        throw new Error(
          "An MCQ has an invalid correct option. Please regenerate."
        );
      }

      if (question.expectedPoints.length < 1) {
        throw new Error(
          "An MCQ is missing its correct-answer explanation. Please regenerate."
        );
      }
    }

    if (question.type === "Descriptive") {
      question.options = [];
      question.correctOption = null;

      if (
        question.expectedPoints.length < 2 ||
        question.expectedPoints.length > 4
      ) {
        throw new Error(
          "Each descriptive question must contain 2 to 4 expected answer points. Please regenerate."
        );
      }
    }
  }

  const mcqQuestions = questions.filter(
    (question) => question.type === "MCQ"
  );

  const descriptiveQuestions = questions.filter(
    (question) => question.type === "Descriptive"
  );

  if (
    mcqQuestions.length !== MCQ_LIMIT ||
    descriptiveQuestions.length !== DESCRIPTIVE_LIMIT
  ) {
    throw new Error(
      "Gemini must return exactly 6 MCQs and 6 descriptive questions. Please regenerate."
    );
  }

  return questions;
};

module.exports = { generateInterviewQuestions };
