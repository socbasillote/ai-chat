import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { streamChat } from "../controllers/chat.controller.js";

const router = Router();

router.use(authenticate);

router.post("/:id/messages/stream", streamChat);

export default router;
