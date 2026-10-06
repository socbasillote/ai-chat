import { Router } from "express";

import {
  create,
  remove,
  getById,
  list,
  update,
} from "../controllers/conversation.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { validateObjectId } from "../middleware/validate-object-id.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", list);

router.post("/", create);

router.get("/:id", validateObjectId, getById);

router.patch("/:id", validateObjectId, update);

router.delete("/:id", validateObjectId, remove);

export default router;
