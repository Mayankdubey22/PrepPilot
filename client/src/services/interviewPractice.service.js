
import { API_BASE_URL, apiFetch } from "./api";

export const getInterviewPractice = async (preparationId) => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/interview-practice/${preparationId}`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch {
    return {
      success: false,
      status: 0,
      data: { message: "Unable to connect to the server." },
    };
  }
};

export const generateInterviewPractice = async (
  preparationId
) => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/interview-practice/${preparationId}/generate`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch {
    return {
      success: false,
      status: 0,
      data: { message: "Unable to connect to the server." },
    };
  }
};


export const saveInterviewAnswer = async (
  preparationId,
  questionId,
  userAnswer
) => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/interview-practice/${preparationId}/questions/${questionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userAnswer }),
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch {
    return {
      success: false,
      status: 0,
      data: { message: "Unable to connect to the server." },
    };
  }
};


export const evaluateInterviewAnswer = async (
  preparationId,
  questionId
) => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/interview-practice/${preparationId}/questions/${questionId}/evaluate`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch {
    return {
      success: false,
      status: 0,
      data: {
        message: "Unable to connect to the server.",
      },
    };
  }
};


export const getInterviewPracticeStats = async () => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/interview-practice/stats`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch {
    return {
      success: false,
      status: 0,
      data: {
        message: "Unable to connect to the server.",
      },
    };
  }
};
