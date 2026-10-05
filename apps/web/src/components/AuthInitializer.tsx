import { useEffect } from "react";

import {
  initializeAuth,
  sessionExpired,
} from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const dispatch = useAppDispatch();

  const initialized = useAppSelector((state) => state.auth.initialized);

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(sessionExpired());
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);

    if (!initialized) {
      dispatch(initializeAuth());
    }

    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [dispatch, initialized]);

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
