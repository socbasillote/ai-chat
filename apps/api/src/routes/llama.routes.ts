import { Router } from "express";

import { testLlama } from "../controllers/llama.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/test", authenticate, testLlama);

export default router;
