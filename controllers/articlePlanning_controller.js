import ArticlePlanning from "../models/article_planning_modal.js";
import createError from "../utilies/errorHandle.js";
import { createdResponse, sendResponse } from "../utilies/responseHandler.js";
import Article from "../models/article_modal.js";
import PlanningRoute from "../models/planning_route_modal.js";
import mongoose from "mongoose";
import { getDifferenceDays } from "../utilies/date.js";
import { articlePlanningEnumValues } from "../constant/enum_contants.js";

// @desc    Create article planning
// @route   POST /api/articlePlanning
// @access  Private
export const createArticlePlanning = async (req, res) => {
  if (!req.body) {
    throw createError("Request body is required", 400);
  }
  const {
    article_id,
    planningRoute_id,
    total_payment,
    when_process_end,
    when_process_start,
  } = req.body;

  if (when_process_start && when_process_start.includes("/")) {
    throw createError("Process start date must be in YYYY-MM-DD format", 400);
  }

  if (when_process_end && when_process_end.includes("/")) {
    throw createError("Process end date must be in YYYY-MM-DD format", 400);
  }

  // Validate required fields
  const requiredFields = [
    "article_id",
    "planningRoute_id",
    "total_payment",
    "when_process_end",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length > 0) {
    throw createError(
      `Missing required fields: ${missingFields.join(", ")}`,
      400
    );
  }

  if (!mongoose.Types.ObjectId.isValid(article_id)) {
    throw createError("Invalid article id", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(planningRoute_id)) {
    throw createError("Invalid planning route id", 400);
  }

  // Check if article_id exists
  const article = await Article.findById(article_id);
  if (!article) {
    throw createError("Article not found", 404);
  }

  // Check if article_id is already assigned to planningRoute_id
  const articlePlanning = await ArticlePlanning.findOne({
    article_id,
    planningRoute_id,
  });
  if (articlePlanning) {
    throw createError("Article already assigned to planning Phase", 400);
  }

  // Check if planningRoute_id is already assigned to article_id
  const planningRouteId = await PlanningRoute.findById(planningRoute_id);
  if (!planningRouteId) {
    throw createError("Planning route not found", 404);
  }

  if (total_payment < 1) {
    throw createError("Total payment must be greater than 0", 400);
  }

  if (when_process_end <= Date.now() || when_process_end < when_process_start) {
    throw createError(
      "Process end date must be greater than today's date and greater than process start date",
      400
    );
  }

  if (when_process_start < Date.now()) {
    throw createError(
      "Process start date must be greater than today's date or you can leave it which means process start date is today",
      400
    );
  }

  // Check if planningRoute_id exists
  const planningRoute = await PlanningRoute.findById(planningRoute_id);

  if (!planningRoute) {
    throw createError("Planning route not found", 404);
  }

  const porcess_days = getDifferenceDays(when_process_end);

  let status = articlePlanningEnumValues.STATUS_TYPES[1];

  const planningName = "PL-" + Math.floor(1000 + Math.random() * 9000);

  if (when_process_start) {
    status = articlePlanningEnumValues.STATUS_TYPES[0];
  }

  try {
    const articlePlanning = await ArticlePlanning.create({
      article_id,
      planningRoute_id,
      total_payment,
      process_days: porcess_days,
      when_process_end,
      status,
      when_process_start,
      planningName,
    });
    return createdResponse(res, articlePlanning);
  } catch (error) {
    throw createError(error.message, 500);
  }
};

export const getAllArticlePlannings = async (req, res) => {
  let filter = {};
  let page_limit = parseInt(req.query.limit) || 10;
  let page = parseInt(req.query.page) || 1;



  // ✅ AND Logic: All query parameters must match
  const { status, order_slip, search, article_id, planningRoute_id } = req.query;

  if(article_id)
  {
    filter.article_id = article_id;
  }

  if(planningRoute_id)
  {
    filter.planningRoute_id = planningRoute_id;
  }

  if(status)
  {
    filter.status = status;
  }

  if(order_slip)
  {
    filter.order_slip = order_slip;
  }

  if(search)
  {
    filter.$or = [
      { article_id: { $regex: search, $options: "i" } },
      { planningRoute_id: { $regex: search, $options: "i" } },
      { planningName: { $regex: search, $options: "i" } },
      
    ];
  }

  try {
    let articlePlanning = await ArticlePlanning.find(filter);

    articlePlanning = articlePlanning.map((articlePlanningItem) => {
      if (articlePlanningItem.when_process_end < Date.now()) {
        articlePlanningItem.late = true;
      }

      if (articlePlanningItem.order_slip === "Received") {
        articlePlanningItem.status = articlePlanningEnumValues.STATUS_TYPES[2];
      }

      if(articlePlanningItem.status === articlePlanningEnumValues.STATUS_TYPES[2] && articlePlanningItem.order_slip === "Issued")
      {
        articlePlanningItem.order_slip = "Received";
      }

      return articlePlanningItem;
    });

    return sendResponse(
      res,
      200,
      "Article Planning fetched successfully",
      articlePlanning
    );
  } catch (error) {
    throw createError(error.message, 500);
  }
};
