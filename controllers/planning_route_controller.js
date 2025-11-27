import asyncHandler from "express-async-handler";
import PlanningRoute from "../models/planning_route_modal.js";
import createError from "../utilies/errorHandle.js";
import {
  createdResponse,
  noContentResponse,
  successResponse,
} from "../utilies/responseHandler.js";
import getEnumErrorMessage from "../utilies/getEnumErrorMessage.js";
import { planningRouteEnumValues } from "../constant/enum_contants.js";
import mongoose from "mongoose";

// @desc    Create planning route
// @route   POST /api/planning-route
// @access  Private
const createPlanningRoute = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw createError("Request body is required", 400);
  }
  const { planning_route_name, planning_route_type, cost_per_meter } = req.body;
  if (!planning_route_name || !planning_route_type || !cost_per_meter) {
    throw createError("Please add all fields", 400);
  }
  const planningRouteExists = await PlanningRoute.findOne({
    planning_route_name,
  });
  if (planningRouteExists) {
    throw createError("Planning route already exists", 400);
  }

  // Pre-validate enum values with detailed error messages
  if (
    planning_route_type &&
    !planningRouteEnumValues.PLANNING_ROUTE_TYPES.includes(planning_route_type)
  ) {
    throw createError(
      getEnumErrorMessage(
        "Planning route type",
        planning_route_type,
        planningRouteEnumValues.PLANNING_ROUTE_TYPES
      ),
      400
    );
  }
  const planningRoute = await PlanningRoute.create({
    user: req.user._id,
    planning_route_name,
    planning_route_type,
    cost_per_meter,
  });
  if (!planningRoute) {
    throw createError("Planning route not created. Invalid data", 400);
  } else {
    return createdResponse(
      res,
      "Planning route created successfully",
      planningRoute
    );
  }
});

// @desc    Get all planning routes with pagination and search
// @route   GET /api/planning-route
// @access  Private
// Query params: page (default: 1), limit (default: 10), search (optional)
const getAllPlanningRoutes = asyncHandler(async (req, res) => {
  let filter = {};
  let page_limit = parseInt(req.query.page_limit) || 10;
  let page = parseInt(req.query.page) || 1;

  // ✅ AND Logic: All query parameters must match
  const { search } = req.query;

  if (search) {
    filter.planning_route_name = { $regex: search, $options: "i" };
  }

  // ✅ FIXED: Proper MongoDB pagination
  const skip = (page - 1) * page_limit;

  const planningRoutes = await PlanningRoute.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(page_limit);

  const allPlanningRoutesCount = await PlanningRoute.countDocuments(filter);
  const totalPages = Math.ceil(allPlanningRoutesCount / page_limit);

  // Check if requested page exceeds total pages
  if (page > 1 && page > totalPages) {
    throw createError(
      `Page ${page} does not exist. Maximum page is ${totalPages + 1}`,
      400
    );
  }

  // Format response
  const formattedPlanningRoutes = planningRoutes.map((planningRoute) => ({
    _id: planningRoute._id,
    planning_route_name: planningRoute.planning_route_name,
    planning_route_type: planningRoute.planning_route_type,
    cost_per_meter: planningRoute.cost_per_meter,
    lead_time_days: planningRoute.lead_time_days,
    createdAt: planningRoute.createdAt,
    updatedAt: planningRoute.updatedAt,
  }));

  const data = {
    count: allPlanningRoutesCount,
    result: formattedPlanningRoutes,
    pagination: {
      current_page: page,
      page_limit: page_limit,
      total_pages: Math.ceil(allPlanningRoutesCount / page_limit),
      total_items: allPlanningRoutesCount,
      isNext: page < Math.ceil(allPlanningRoutesCount / page_limit),
      isPrev: page > 1,
    },
  };

  return successResponse(res, "Planning routes fetched successfully", data);
});

// @desc get all Planning Route without pagination
// @route GET /api/planning-route/all
// @access Private
export const getAllPlanningRouteWithoutPagination = async (req, res) => {
  const planningRoute = await PlanningRoute.find();
  return successResponse(res, "Categorys fetched successfully", planningRoute);
};

// @desc    Get single planning route
// @route   GET /api/planning-route/:id
// @access  Private
const getSinglePlanningRoute = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    throw createError("Planning route id is required", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw createError("Invalid planning route id", 400);
  }
  const planningRoute = await PlanningRoute.findById(req.params.id);
  if (!planningRoute) {
    throw createError("Planning route not found", 404);
  } else {
    return successResponse(
      res,
      `Planning route with id ${req.params.id} fetched successfully`,
      planningRoute
    );
  }
});

// @desc    Update planning route only cost_per_meter
// @route   PATCH /api/planning-route/:id
// @access  Private
const updatePlanningRoute = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    throw createError("Planning route id is required", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw createError("Invalid planning route id", 400);
  }
  const planningRoute = await PlanningRoute.findById(req.params.id);
  if (!planningRoute) {
    throw createError("Planning route not found", 404);
  }
  // Check if any field other than cost_per_meter is present in the request body
  const allowedFields = ["cost_per_meter", "lead_time_days"];
  const receivedFields = Object.keys(req.body);
  const invalidFields = receivedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    throw createError(
      `Only 'cost_per_meter' and 'lead_time_days' fields can be updated. Invalid fields: ${invalidFields.join(
        ", "
      )}`,
      400
    );
  }

  const { cost_per_meter, lead_time_days } = req.body;
  if (lead_time_days < 0) {
    throw createError("Lead time days cannot be negative", 400);
  }

  if (cost_per_meter < 0) {
    throw createError("Cost per meter cannot be negative", 400);
  }
  const updatedPlanningRoute = await PlanningRoute.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedPlanningRoute) {
    throw createError("Planning route not updated. Invalid data", 400);
  } else {
    return successResponse(
      res,
      `Planning route with id ${req.params.id} updated successfully`,
      updatedPlanningRoute
    );
  }
});

// @desc    Delete planning route
// @route   DELETE /api/planning-route/:id
// @access  Private
const deletePlanningRoute = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    throw createError("Planning route id is required", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw createError("Invalid planning route id", 400);
  }
  const planningRoute = await PlanningRoute.findById(req.params.id);
  if (!planningRoute) {
    throw createError("Planning route not found", 404);
  }
  const deletedPlanningRoute = await planningRoute.deleteOne({
    _id: req.params.id,
  });
  if (!deletedPlanningRoute) {
    throw createError("Planning route not deleted. Invalid data", 400);
  } else {
    return noContentResponse(
      res,
      `Planning route with id ${req.params.id} deleted successfully`
    );
  }
});

export {
  createPlanningRoute,
  getAllPlanningRoutes,
  getSinglePlanningRoute,
  updatePlanningRoute,
  deletePlanningRoute,
};
