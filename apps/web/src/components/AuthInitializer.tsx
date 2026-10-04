import { useEffect } from "react";

import { initializeAuth } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const dispatch = useAppDispatch();

  const initialized = useAppSelector((state) => state.auth.initialized);

  useEffect(() => {
    if (!initialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized]);

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
