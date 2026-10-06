import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { streamChat } from "../controllers/chat.controller.js";
import { validateObjectId } from "../middleware/validate-object-id.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/:id/messages/stream", validateObjectId, streamChat);

export default router;
