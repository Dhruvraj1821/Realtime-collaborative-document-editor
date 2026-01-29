import express from "express";
import {
  signup,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import validateSignup from "../middleware/validateSignup.js";

const router = express.Router();

router.post("/signup", validateSignup, signup);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
