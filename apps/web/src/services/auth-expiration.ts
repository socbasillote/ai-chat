export const fetchWithSessionExpiration = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const response = await fetch(input, init);

  if (response.status === 401 && typeof window !== "undefined") {
    const headers = new Headers(
      input instanceof Request ? input.headers : init?.headers,
    );
    const authorization = headers.get("Authorization");
    const requestToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    if (!requestToken || requestToken !== localStorage.getItem("accessToken")) {
      return response;
    }

    window.dispatchEvent(new Event("auth:session-expired"));
  }

  return response;
};
