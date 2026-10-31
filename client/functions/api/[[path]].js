const API_ORIGIN = "https://preppilot-api-ur97.onrender.com";

export async function onRequest({ request }) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, API_ORIGIN);

  return fetch(new Request(upstreamUrl, request));
}
