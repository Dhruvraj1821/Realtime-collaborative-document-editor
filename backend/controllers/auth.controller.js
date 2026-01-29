import User from "../models/User.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import jwt from "jsonwebtoken";

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
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  res.status(200).json({
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token is required",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  const tokenExists = user.refreshTokens.some(
    (t) => t.token === refreshToken
  );

  if (!tokenExists) {
    return res.status(401).json({
      message: "Refresh token not recognized",
    });
  }

  const newAccessToken = generateAccessToken(user._id);

  res.status(200).json({
    accessToken: newAccessToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token is required",
    });
  }

  const user = await User.findOne({
    "refreshTokens.token": refreshToken,
  });

  if (!user) {
  
    return res.status(200).json({
      message: "Logout successful",
    });
  }


  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.token !== refreshToken
  );

  await user.save();

  res.status(200).json({
    message: "Logout successful",
  });
});
