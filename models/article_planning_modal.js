import mongoose from "mongoose";
import { articlePlanningEnumValues } from "../constant/enum_contants.js";

const articlePlanningSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  planningRoute_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PlanningRoute",
    required: true,
  },

  article_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article",
    required: true,
  },

  planningName: {
    type: String,
    required: true,
    
  },

  status: {
    type: String,
    enum: articlePlanningEnumValues.STATUS_TYPES,
    default: articlePlanningEnumValues.STATUS_TYPES[0],
  },

  late: {
    type: Boolean,
    default: false,
  },

  when_process_start: {
    type: Date,
    default: Date.now,
  },

  total_payment: {
    type: Number,
    required: true,
  },
  order_slip: {
    type: String,
    enum: ["Issued", "Received"],
    required: true,
    default: "Issued",
  },
  process_days: {
    type: Number,
    min: 1,
    required: true,
  },
  when_process_end: {
    type: Date,
    required: true,
  },
}, {
    timestamps: true,
});

const ArticlePlanning = mongoose.model("ArticlePlanning", articlePlanningSchema);

export default ArticlePlanning;

