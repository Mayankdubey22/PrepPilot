import { API_BASE_URL, apiFetch } from "./api";

const API_URL = `${API_BASE_URL}/mock-interviews`;

const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await apiFetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error("Mock interview API error:", error);
    return {
      success: false,
      status: 0,
      data: { message: "Unable to connect to the server. Please try again." },
    };
  }
};

export const getMockInterview = (
  preparationId,
  milestone = 50
) => {
  return apiRequest(
    `/${preparationId}?milestone=${milestone}`,
  );
};

export const prepareMockInterviewQuestions = (
  preparationId,
  milestone = 50
) =>
  apiRequest(
    `/${preparationId}/questions/prepare?milestone=${milestone}`,
    { method: "POST" }
  );

export const startMockInterview = (
  preparationId,
  milestone = 50
) =>
  apiRequest(
    `/${preparationId}/start?milestone=${milestone}`,
    { method: "POST" }
  );

export const saveMockAnswer = (interviewId, questionId, answer) =>
  apiRequest(`/${interviewId}/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify({ answer }),
  });

export const markQuestionForReview = (interviewId, questionId, markedForReview) =>
  apiRequest(`/${interviewId}/questions/${questionId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ markedForReview }),
  });

export const terminateMockInterview = (interviewId, reason) =>
  apiRequest(`/${interviewId}/terminate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

export const completeMockInterview = (interviewId) =>
  apiRequest(`/${interviewId}/complete`, { method: "POST" });

export const getMockInterviewReport = (preparationId, interviewId) =>
  apiRequest(`/${preparationId}/report/${interviewId}`);
