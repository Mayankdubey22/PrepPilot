
const API_BASE_URL = "http://localhost:5000/api";

// Create a new preparation
export const createPreparation = async (preparationData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/preparations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preparationData),
    });

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

// Get all preparations belonging to the logged-in user
export const getMyPreparations = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/preparations`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

// Generate a personalized AI preparation plan
export const generatePreparationPlan = async (
  preparationId,
  token
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/preparation-plans/${preparationId}/generate`,
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
      data: {
        message: "Unable to connect to the server.",
      },
    };
  }
};

// Get an already saved AI preparation plan
export const getPreparationPlan = async (
  preparationId,
  token
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/preparation-plans/${preparationId}`,
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
  isCompleted,
  token
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/preparation-plans/${preparationId}/days/${dayId}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: {
        message: "Unable to connect to the server.",
      },
    };
  }
};
