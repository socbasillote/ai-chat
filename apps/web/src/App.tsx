import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import { useAppSelector } from "./store/hooks";
import { ChatPage } from "./pages/ChatPage";

/* const ChatScreen = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    createConversation().then(
      (conversation) => {
        if (!cancelled) {
          setConversationId(conversation.id);
        }
      },
      (reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to create conversation.",
          );
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p>{error}</p>;
  }

  if (!conversationId) {
    return <p>Starting conversation...</p>;
  }

  return <StreamingTest conversationId={conversationId} />;
}; */

const AppRoutes = () => {
  const { isAuthenticated, initialized } = useAppSelector(
    (state) => state.auth,
  );

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
