import express from "express";
import {
  signup,
  login,
  refreshAccessToken,
  logout,
} from "../controllers/auth.controller.js";
import validateSignup from "../middleware/validateSignup.js";

const router = express.Router();

router.post("/signup", validateSignup, signup);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;
