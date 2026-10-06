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
    if (
      error instanceof Error &&
      error.message.startsWith("Missing required environment variable:")
    ) {
      console.error(error.message);
    } else {
      console.error(
        "Failed to start API server. Verify configuration and service availability.",
      );
    }
    process.exit(1);
  }
};

void startServer();
