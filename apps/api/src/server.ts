import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      console.log(`API server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
