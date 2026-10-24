
const API_BASE_URL = "https://preppilot-api-ur97.onrender.com/api";

export const getInterviewPractice = async (preparationId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/interview-practice/${preparationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: { message: "Unable to connect to the server." },
    };
  }
};

export const generateInterviewPractice = async (
  preparationId,
  token
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/interview-practice/${preparationId}/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
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
  userAnswer,
  token
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/interview-practice/${preparationId}/questions/${questionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
  questionId,
  token
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/interview-practice/${preparationId}/questions/${questionId}/evaluate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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


export const getInterviewPracticeStats = async (token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/interview-practice/stats`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
