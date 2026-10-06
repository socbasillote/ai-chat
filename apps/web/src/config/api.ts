const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiUrl =
  configuredApiUrl || (import.meta.env.DEV ? "http://localhost:3000" : "");

if (!apiUrl) {
  throw new Error(
    "VITE_API_URL must be set to the API base URL in production.",
  );
}

let parsedApiUrl: URL;

try {
  parsedApiUrl = new URL(apiUrl);
} catch {
  throw new Error("VITE_API_URL must be a valid HTTP(S) URL.");
}

if (
  (parsedApiUrl.protocol !== "http:" && parsedApiUrl.protocol !== "https:") ||
  parsedApiUrl.username ||
  parsedApiUrl.password
) {
  throw new Error(
    "VITE_API_URL must be an HTTP(S) URL without embedded credentials.",
  );
}

export const API_URL = apiUrl.replace(/\/+$/, "");
