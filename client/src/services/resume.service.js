
import { API_BASE_URL, apiFetch } from "./api";

export const uploadResume = async (file) => {
  try {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await apiFetch(`${API_BASE_URL}/resumes`, {
      method: "POST",
      body: formData,
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
