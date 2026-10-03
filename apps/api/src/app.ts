import cors from "cors";
import express from "express";

import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import llamaRoutes from "./routes/llama.routes.js";
import chatRoutes from "./routes/chat.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";
import { env } from "./config/env.js";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/conversations", conversationRoutes);

app.use("/api/conversations", messageRoutes);
app.use("/api/llama", llamaRoutes);
app.use("/api/conversations", chatRoutes);

app.use(errorHandler);

export default app;


