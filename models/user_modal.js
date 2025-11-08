import mongoose from "mongoose";
import { roleEnumValues } from "../constant/enum_contants.js";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"]
  },
  userType: {
    type: String,
    enum: roleEnumValues.ROLE_TYPES,
    required: [true, "User type is required"],
    default: "designer"
  },
}, { 
  timestamps: true 
});

export default mongoose.model("User", userSchema);