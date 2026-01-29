import User from "../models/User.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";


export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;


  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      message: "User already exists with this email",
    });
  }

 
  const user = await User.create({
    name,
    email,
    password,
  });

  res.status(201).json({
    message: "Signup successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  
  res
    .cookie("accessToken", accessToken, {
      httpOnly: false,        
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,         
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .status(200)
    .json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
});


export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const tokenExists = user.refreshTokens.some(
    (t) => t.token === refreshToken
  );

  if (!tokenExists) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const newAccessToken = generateAccessToken(user._id);

  res.cookie("accessToken", newAccessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json({ message: "Access token refreshed" });
});


export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const user = await User.findOne({
      "refreshTokens.token": refreshToken,
    });

    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.token !== refreshToken
      );
      await user.save();
    }
  }

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .status(200)
    .json({ message: "Logout successful" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      message: "If the email exists, a reset link has been sent",
    });
  }


  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");


  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  await user.save();


  const resetUrl = `http://localhost:${process.env.PORT}/api/auth/reset-password/${resetToken}`;

  console.log("🔑 PASSWORD RESET URL:");
  console.log(resetUrl);

  res.status(200).json({
    message: "If the email exists, a reset link has been sent",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long",
    });
  }


  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      message: "Invalid or expired reset token",
    });
  }

 
  user.password = newPassword;


  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;


  user.refreshTokens = [];

  await user.save();

  res.status(200).json({
    message: "Password reset successful. Please login again.",
  });
});
