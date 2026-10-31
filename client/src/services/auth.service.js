import { API_BASE_URL, apiFetch } from "./api";

export const signupUser = async (userData) => {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/auth/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
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
        message:
          "Unable to connect to the server.",
      },
    };
  }
};

export const signinUser = async (userData) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
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
      data: {
        message: "Unable to connect to the server.",
      },
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/me`);
    const data = await response.json();

    return { success: response.ok, status: response.status, data };
  } catch {
    return {
      success: false,
      status: 0,
      data: { message: "Unable to connect to the server." },
    };
  }
};

export const signoutUser = async () => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/signout`, {
      method: "POST",
    });
    return { success: response.ok };
  } catch {
    return { success: false };
  }
};
