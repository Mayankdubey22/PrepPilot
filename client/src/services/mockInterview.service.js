const API_URL =
  "https://preppilot-api-ur97.onrender.com/api/mock-interviews";

const apiRequest = async (endpoint, token, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
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

const milestoneQuery = (milestone = 50) =>
  `?milestone=${[50, 75, 100].includes(Number(milestone)) ? Number(milestone) : 50}`;

export const getMockInterview = (
  preparationId,
  token,
  milestone = 50
) => {
  return apiRequest(
    `/${preparationId}?milestone=${milestone}`,
    token
  );
};

export const prepareMockInterviewQuestions = (
  preparationId,
  token,
  milestone = 50
) =>
  apiRequest(
    `/${preparationId}/questions/prepare?milestone=${milestone}`,
    token,
    { method: "POST" }
  );

export const startMockInterview = (
  preparationId,
  token,
  milestone = 50
) =>
  apiRequest(
    `/${preparationId}/start?milestone=${milestone}`,
    token,
    { method: "POST" }
  );

export const saveMockAnswer = (interviewId, questionId, answer, token) =>
  apiRequest(`/${interviewId}/questions/${questionId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ answer }),
  });

export const markQuestionForReview = (interviewId, questionId, markedForReview, token) =>
  apiRequest(`/${interviewId}/questions/${questionId}/review`, token, {
    method: "PATCH",
    body: JSON.stringify({ markedForReview }),
  });

export const terminateMockInterview = (interviewId, reason, token) =>
  apiRequest(`/${interviewId}/terminate`, token, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

export const completeMockInterview = (interviewId, token) =>
  apiRequest(`/${interviewId}/complete`, token, { method: "POST" });

export const getMockInterviewReport = (preparationId, interviewId, token) =>
  apiRequest(`/${preparationId}/report/${interviewId}`, token);
