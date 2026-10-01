import { Router } from "express";

import {
  create,
  remove,
  getById,
  list,
  update,
} from "../controllers/conversation.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", list);

router.post("/", create);

router.get("/:id", getById);

router.patch("/:id", update);

router.delete("/:id", remove);

export default router;
