import express from "express";

import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/conversations", conversationRoutes);

app.use(errorHandler);

export default app;
