
import { API_BASE_URL, apiFetch } from "./api";

// Create a new preparation
export const createPreparation = async (preparationData) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/preparations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preparationData),
    });

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

// Get all preparations belonging to the logged-in user
export const getMyPreparations = async () => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/preparations`, {
      method: "GET",
    });

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

// Generate a personalized AI preparation plan
export const generatePreparationPlan = async (
  preparationId
) => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/preparation-plans/${preparationId}/generate`,
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

// Get an already saved AI preparation plan
export const getPreparationPlan = async (
  preparationId
) => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/preparation-plans/${preparationId}`,
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


export const updatePreparationTask = async (
  preparationId,
  dayId,
  taskId,
  isCompleted
) => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/preparation-plans/${preparationId}/days/${dayId}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isCompleted }),
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
