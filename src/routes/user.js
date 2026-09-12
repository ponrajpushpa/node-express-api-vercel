import express from "express";

import { validateRole, validateToken } from "../middleware/index.js";
import { getAllUsers, me } from "../controllers/UserController.js";

const router = express.Router();

router.get("/getAllUsers", validateToken, validateRole(["admin","user"]), getAllUsers);
router.get("/me", validateToken, me);

export default router;
