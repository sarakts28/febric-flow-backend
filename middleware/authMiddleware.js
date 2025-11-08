import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/user_modal.js";
import createError from "../utilies/errorHandle.js";

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check Authorization header first
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Then check cookies
    else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
  
    if (!token) {
      throw createError('Not authorized, no token', 401);
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      throw createError('Not authorized, token failed', 401);
    }
  });

export default protect;
