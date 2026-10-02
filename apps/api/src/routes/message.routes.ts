import { Router } from "express";

import { create, list } from "../controllers/message.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/:id/messages", list);

router.post("/:id/messages", create);

export default router;
