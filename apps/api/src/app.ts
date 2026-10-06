import cors from "cors";
import express from "express";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import llamaRoutes from "./routes/llama.routes.js";
import chatRoutes from "./routes/chat.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";
import { env } from "./config/env.js";
import { checkDatabaseHealth } from "./config/database.js";
import { checkLlamaHealth } from "./services/llama.service.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", async (_req, res) => {
  const [mongodbAvailable, llamaAvailable] = await Promise.all([
    checkDatabaseHealth(),
    checkLlamaHealth(),
  ]);
  const healthy = mongodbAvailable && llamaAvailable;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    checks: {
      api: "ok",
      mongodb: mongodbAvailable ? "ok" : "unavailable",
      llama: llamaAvailable ? "ok" : "unavailable",
    },
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/conversations", conversationRoutes);

app.use("/api/conversations", messageRoutes);
app.use("/api/llama", llamaRoutes);
app.use("/api/conversations", chatRoutes);

app.use(errorHandler);

export default app;
