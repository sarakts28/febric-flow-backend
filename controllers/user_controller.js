import asyncHandler from "express-async-handler";
import User from "../models/user_modal.js";
import bcrypt from "bcryptjs";
import createError from "../utilies/errorHandle.js";
import {
  generateAuthToken,
  generateRefreshToken,
} from "../utilies/generateToken.js";
import jwt from "jsonwebtoken";

// @desc    Register new user
// @route   POST /api/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const type = ["admin", "accountant", "store keeper", "cashier", "designer"];

  console.log("Body:", req.body);

  if (Object.keys(req.body).length === 0) {
    throw createError("Request body is required", 400);
  }
  const { name, email, password, userType } = req.body;
  if (!name || !email || !password || !userType) {
    throw createError("Please add all fields", 400);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw createError("User already exists", 400);
  }

  if (!type.includes(userType)) {
    throw createError(
      "Invalid user type. User type can be admin, accountant, store keeper, cashier, designer",
      400
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = await User.create({
    name,
    email,
    password: hash,
    userType,
  });

  if (!user) {
    throw createError("User not created. Invalid data", 400);
  } else {
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        username: user.name,
        email: user.email,
        userType: user.userType,
      },
    });
  }
});

// @desc    Auth user
// @route   POST /api/login
// @access  Public
// @desc    Auth user
// @route   POST /api/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw createError("Request body is required", 400);
  }
  const { email, password } = req.body;
  if (!email || !password) {
    throw createError("Please add all fields", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw createError("User not found", 400);
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError("Invalid credentials", 400);
  }
  const token = generateAuthToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set refresh token as HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // ✅ ALSO set access token as HTTP-only cookie
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
  });

  res.status(201).json({
    success: true,
    message: "User logged in successfully",
    user: {
      username: user.name,
      email: user.email,
      userType: user.userType,
    },
    // You can remove accessToken from response body if using cookies
    // accessToken: token,
  });
});

// @desc    Refresh token
// @route   GET /api/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    throw createError("Refresh token missing", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAuthToken(decoded.id);

    // ✅ Set the new access token as cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      // Optionally return accessToken in response for mobile apps
      // accessToken: newAccessToken,
    });
  } catch (err) {
    throw createError("Invalid or expired refresh token", 403);
  }
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

// @desc    Get current user
// @route   GET /api/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const { _id, name, email, userType } = await User.findById(req.user.id);
  console.log(userType, "userType");
  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    user: {
      id: _id,
      name,
      email,
      userType,
    },
  });
});

export { register, login, getMe, refreshToken, logout };
