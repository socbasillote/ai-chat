import { Router } from "express";

import { create, list } from "../controllers/message.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { validateObjectId } from "../middleware/validate-object-id.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/:id/messages", validateObjectId, list);

router.post("/:id/messages", validateObjectId, create);

export default router;
