import mongoose from "mongoose";

import { env } from "./env.js";

export const checkDatabaseHealth = async (): Promise<boolean> => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return false;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const ping = mongoose.connection.db.admin().command({ ping: 1 });
    const timedPing = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => resolve(false), 2_000);
    });

    return await Promise.race([ping.then(() => true), timedPing]);
  } catch {
    return false;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(env.mongodbUri);

  console.log("MongoDB connected");
};
