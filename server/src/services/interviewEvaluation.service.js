
const { GoogleGenAI } = require("@google/genai");

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const evaluateInterviewAnswer = async ({
  question,
  topic,
  expectedPoints = [],
  userAnswer,
  targetRole,
}) => {
  if (typeof userAnswer !== "string" || !userAnswer.trim()) {
    throw new Error("Please provide an answer to evaluate.");
  }

  if (typeof question !== "string" || !question.trim()) {
    throw new Error("Please provide the interview question.");
  }

  const prompt = `
You are an experienced technical interviewer evaluating a candidate fairly.

Target role: ${targetRole || "Software Developer"}
Topic: ${topic || "General"}
Interview question: ${question}
Expected answer points: ${JSON.stringify(expectedPoints)}
Candidate's answer: ${userAnswer}

Evaluate the candidate's answer.

Scoring rules:
- Return an integer score from 0 to 100.
- 0 means completely irrelevant or fundamentally incorrect.
- 1-30 means mostly incorrect or irrelevant.
- 31-50 means limited understanding with major gaps.
- 51-70 means partially correct with important gaps.
- 71-85 means good understanding with minor gaps.
- 86-100 means an excellent, accurate, complete answer.
- Do not award points just because an answer is long.
- Compare the answer directly with the question and expected points.
- If the answer is about a different subject, give a low score.
- Do not penalize reasonable alternative explanations that are correct.
- Keep feedback concise, specific, and constructive.
- The suggested answer must directly answer the interview question.
- Strengths must identify what the candidate explained correctly.
- Improvements must identify specific missing, incorrect, or weak areas.
- Do not invent strengths when the answer has no meaningful strengths.
- If the answer is fundamentally incorrect, explain what needs correction.

Return ONLY valid JSON in exactly this format:
{
  "score": 75,
  "feedback": "Brief explanation of the score and the main gaps.",
  "suggestedAnswer": "A clear, accurate model answer to the question.",
  "strengths": ["A specific thing the candidate explained correctly."],
  "improvements": ["A specific area that needs improvement."]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;

    if (typeof responseText !== "string" || !responseText.trim()) {
      throw new Error("Gemini returned an empty evaluation.");
    }

    // Remove Markdown code fences if Gemini includes them.
    const cleanedText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let evaluation;

    try {
      evaluation = JSON.parse(cleanedText);
    } catch {
      throw new Error("Gemini returned invalid evaluation JSON.");
    }

    const score = Number(evaluation.score);

    if (!Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error("Gemini returned an invalid evaluation score.");
    }

    if (
      typeof evaluation.feedback !== "string" ||
      !evaluation.feedback.trim() ||
      typeof evaluation.suggestedAnswer !== "string" ||
      !evaluation.suggestedAnswer.trim()
    ) {
      throw new Error("Gemini returned incomplete evaluation details.");
    }

    const normalizeList = (value) => {
      if (!Array.isArray(value)) {
        return [];
      }

      return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    };

    return {
      score,
      feedback: evaluation.feedback.trim(),
      suggestedAnswer: evaluation.suggestedAnswer.trim(),
      strengths: normalizeList(evaluation.strengths),
      improvements: normalizeList(evaluation.improvements),
      evaluatedAt: new Date(),
    };
  } catch (error) {
    console.error(
      "Interview answer evaluation failed:",
      error.message
    );
    throw error;
  }
};

module.exports = { evaluateInterviewAnswer };
