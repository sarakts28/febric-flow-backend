import mongoose from "mongoose";
import { planningRouteEnumValues } from "../constant/enum_contants.js";

const planningRouteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planning_route_name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    planning_route_type: {
      type: String,
      required: [true, "Type is required"],
      enum: planningRouteEnumValues.PLANNING_ROUTE_TYPES,
      default: planningRouteEnumValues.PLANNING_ROUTE_TYPES[0],
    },
    cost_per_meter: {
      type: Number,
      required: [true, "Cost is required"],
      min: 0,
    },
    lead_time_days: {
      type: Number,
      required: [true, "Lead time days is required"],
      min: 0,
      default: 0,
    },
    
  },
  { timestamps: true }
);

export default mongoose.model("PlanningRoute", planningRouteSchema);
