const PRODUCTION_API_URL = "/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : PRODUCTION_API_URL);

export const apiFetch = (url, options = {}) => {
  const headers = new Headers(options.headers || {});
  const method = String(options.method || "GET").toUpperCase();

  // Authentication uses the HttpOnly session cookie. Never put a bearer
  // token into browser storage or send one from the client.
  headers.delete("Authorization");

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
};
