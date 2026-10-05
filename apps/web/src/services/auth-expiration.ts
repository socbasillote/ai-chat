export const notifyUnauthorized = (response: Response): void => {
  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:session-expired"));
  }
};
