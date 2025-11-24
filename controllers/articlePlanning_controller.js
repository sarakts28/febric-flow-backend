import ArticlePlanning from "../models/article_planning_modal.js";
import createError from "../utilies/errorHandle.js";
import { createdResponse, sendResponse } from "../utilies/responseHandler.js";
import Article from "../models/article_modal.js";
import PlanningRoute from "../models/planning_route_modal.js";
import mongoose from "mongoose";
import { getDifferenceDays } from "../utilies/date.js";
import { articlePlanningEnumValues } from "../constant/enum_contants.js";

// Helper function to validate date format
const validateDateFormat = (dateString, fieldName) => {
  if (dateString && dateString.includes("/")) {
    throw createError(`${fieldName} must be in YYYY-MM-DD format`, 400);
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw createError(`Invalid ${fieldName}`, 400);
  }
  
  return date;
};

// Helper function to validate ObjectId
const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(`Invalid ${fieldName}`, 400);
  }
  return true;
};

// @desc    Create article planning
// @route   POST /api/articlePlanning
// @access  Private
export const createArticlePlanning = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    // Validate IDs
    validateObjectId(article_id, "article id");
    validateObjectId(planningRoute_id, "planning route id");

    // Validate dates
    validateDateFormat(when_process_end, "Process end date");
    if (when_process_start) {
      validateDateFormat(when_process_start, "Process start date");
    }

    // Check if article exists
    const article = await Article.findById(article_id).session(session);
    if (!article) {
      throw createError("Article not found", 404);
    }

    // Check if planning route exists
    const planningRoute = await PlanningRoute.findById(planningRoute_id).session(session);
    if (!planningRoute) {
      throw createError("Planning route not found", 404);
    }

    // Check if article is already assigned to this planning route
    const existingArticlePlanning = await ArticlePlanning.findOne({
      article_id,
      planningRoute_id,
    }).session(session);
    
    if (existingArticlePlanning) {
      throw createError("Article already assigned to this planning phase", 400);
    }

    // Validate payment
    if (total_payment < 1) {
      throw createError("Total payment must be greater than 0", 400);
    }

    const currentDate = new Date();
    const processEndDate = new Date(when_process_end);
    const processStartDate = when_process_start ? new Date(when_process_start) : currentDate;

    // Validate dates logic
    if (processEndDate <= currentDate) {
      throw createError("Process end date must be greater than today's date", 400);
    }

    if (processStartDate < currentDate) {
      throw createError("Process start date cannot be in the past", 400);
    }

    if (processEndDate <= processStartDate) {
      throw createError("Process end date must be greater than process start date", 400);
    }

    const processDays = getDifferenceDays(when_process_end);
    const planningName = "PL-" + Math.floor(1000 + Math.random() * 9000);

    // Determine status based on start date
    let status = articlePlanningEnumValues.STATUS_TYPES[1]; // Default to "in progress"
    if (when_process_start && processStartDate > currentDate) {
      status = articlePlanningEnumValues.STATUS_TYPES[0]; // "scheduled"
    }

    // Create article planning
    const articlePlanning = await ArticlePlanning.create([{
      article_id,
      planningRoute_id,
      total_payment,
      process_days: processDays,
      when_process_end,
      status,
      when_process_start: when_process_start || currentDate,
      planningName,
    }], { session });

    // Update article status to 'underProcess' only if creation was successful
    if (article.status !== ARTICLE_ENUM_VALUES.STATUS_TYPES[1]) {
      article.status = ARTICLE_ENUM_VALUES.STATUS_TYPES[1];
      await article.save({ session });
    }

    await session.commitTransaction();

    return createdResponse(res, articlePlanning[0]);
  } catch (error) {
    await session.abortTransaction();
    throw createError(error.message, error.status || 500);
  } finally {
    session.endSession();
  }
};

// Helper function to update article planning status based on conditions
const updateArticlePlanningStatus = async (articlePlanningItem) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Normalize to compare dates without time

  const processEndDate = new Date(articlePlanningItem.when_process_end);
  processEndDate.setHours(0, 0, 0, 0);

  const processStartDate = new Date(articlePlanningItem.when_process_start);
  processStartDate.setHours(0, 0, 0, 0);

  // Check if article is late
  if (processEndDate < currentDate) {
    articlePlanningItem.late = true;
  }

  // Update status based on order slip
  if (articlePlanningItem.order_slip === "Received") {
    articlePlanningItem.status = articlePlanningEnumValues.STATUS_TYPES[2]; // "completed"
    
    // Update associated article status
    const article = await Article.findById(articlePlanningItem.article_id);
    if (article && article.status !== ARTICLE_ENUM_VALUES.STATUS_TYPES[3]) {
      article.status = ARTICLE_ENUM_VALUES.STATUS_TYPES[3]; // "completed" or appropriate status
      await article.save();
    }
  }

  // Update from "scheduled" to "in progress" if start date is today
  if (
    articlePlanningItem.status === articlePlanningEnumValues.STATUS_TYPES[0] && // "scheduled"
    processStartDate.getTime() === currentDate.getTime()
  ) {
    articlePlanningItem.status = articlePlanningEnumValues.STATUS_TYPES[1]; // "in progress"
  }

  return articlePlanningItem;
};

export const getAllArticlePlannings = async (req, res) => {
  try {
    let filter = {};
    const page_limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    // ✅ AND Logic: All query parameters must match
    const { status, order_slip, search, article_id, planningRoute_id } = req.query;

    if (article_id) {
      validateObjectId(article_id, "article id");
      filter.article_id = article_id;
    }

    if (planningRoute_id) {
      validateObjectId(planningRoute_id, "planning route id");
      filter.planningRoute_id = planningRoute_id;
    }

    if (status) {
      filter.status = status;
    }

    if (order_slip) {
      filter.order_slip = order_slip;
    }

    if (search) {
      filter.$or = [
        { article_id: { $regex: search, $options: "i" } },
        { planningRoute_id: { $regex: search, $options: "i" } },
        { planningName: { $regex: search, $options: "i" } },
      ];
    }

    let articlePlannings = await ArticlePlanning.find(filter)
      .limit(page_limit)
      .skip((page - 1) * page_limit);

    // Update status for each article planning
    const updatedArticlePlannings = await Promise.all(
      articlePlannings.map(updateArticlePlanningStatus)
    );

    // Save any changes to the database
    await Promise.all(
      updatedArticlePlannings.map(ap => ap.isModified() ? ap.save() : Promise.resolve())
    );

    return sendResponse(
      res,
      200,
      "Article Planning fetched successfully",
      updatedArticlePlannings
    );
  } catch (error) {
    throw createError(error.message, 500);
  }
};

export const getArticlePlanningById = async (req, res) => {
  try {
    const { id } = req.params;

    validateObjectId(id, "article planning id");

    let articlePlanning = await ArticlePlanning.findById(id);

    if (!articlePlanning) {
      throw createError("Article planning not found", 404);
    }

    // Update status based on current conditions
    articlePlanning = await updateArticlePlanningStatus(articlePlanning);
    
    if (articlePlanning.isModified()) {
      await articlePlanning.save();
    }

    return sendResponse(
      res,
      200,
      "Article planning fetched successfully",
      articlePlanning
    );
  } catch (error) {
    throw createError(error.message, error.status || 500);
  }
};

// @desc    Update article planning - mainly for order slip and status updates
// @route   PUT /api/articlePlanning/:id
// @access  Private
export const updateArticlePlanning = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError("Request body is required", 400);
    }

    // Validate article planning ID
    validateObjectId(id, "article planning id");

    // Find the article planning
    const articlePlanning = await ArticlePlanning.findById(id).session(session);
    if (!articlePlanning) {
      throw createError("Article planning not found", 404);
    }

    const {
      order_slip,
      status,
      total_payment,
      when_process_end,
      when_process_start,
      planningName
    } = req.body;

    // List of allowed fields to update
    const allowedUpdates = {};
    
    // Validate and add order_slip if provided
    if (order_slip) {
      if (!articlePlanningEnumValues.ORDER_SLIP_TYPES.includes(order_slip)) {
        throw createError("Invalid order slip value", 400);
      }
      allowedUpdates.order_slip = order_slip;
    }

    // Validate and add status if provided
    if (status) {
      if (!articlePlanningEnumValues.STATUS_TYPES.includes(status)) {
        throw createError("Invalid status value", 400);
      }
      allowedUpdates.status = status;
    }

    // Validate and add total_payment if provided
    if (total_payment !== undefined) {
      if (total_payment < 1) {
        throw createError("Total payment must be greater than 0", 400);
      }
      allowedUpdates.total_payment = total_payment;
    }

    // Validate and add dates if provided
    if (when_process_end) {
      validateDateFormat(when_process_end, "Process end date");
      const processEndDate = new Date(when_process_end);
      
      if (processEndDate <= new Date()) {
        throw createError("Process end date must be in the future", 400);
      }
      
      allowedUpdates.when_process_end = when_process_end;
      allowedUpdates.process_days = getDifferenceDays(when_process_end);
    }

    if (when_process_start) {
      validateDateFormat(when_process_start, "Process start date");
      const processStartDate = new Date(when_process_start);
      
      if (processStartDate < new Date()) {
        throw createError("Process start date cannot be in the past", 400);
      }
      
      allowedUpdates.when_process_start = when_process_start;
    }

    // Validate planningName if provided
    if (planningName) {
      if (planningName.length < 3) {
        throw createError("Planning name must be at least 3 characters long", 400);
      }
      allowedUpdates.planningName = planningName;
    }

    // If no valid updates provided
    if (Object.keys(allowedUpdates).length === 0) {
      throw createError("No valid fields to update", 400);
    }

    // 🚀 AUTOMATIC STATUS MANAGEMENT BASED ON ORDER SLIP
    let statusChanged = false;
    let articleUpdateRequired = false;

    // If order_slip is being updated to "Received", automatically update status to "completed"
    if (order_slip === "Received" && articlePlanning.order_slip !== "Received") {
      allowedUpdates.status = articlePlanningEnumValues.STATUS_TYPES[2]; // "completed"
      statusChanged = true;
      articleUpdateRequired = true;
    }

    // If order_slip is being updated to "Issued" and current status is "completed", revert to "in progress"
    if (order_slip === "Issued" && articlePlanning.status === articlePlanningEnumValues.STATUS_TYPES[2]) {
      allowedUpdates.status = articlePlanningEnumValues.STATUS_TYPES[1]; // "in progress"
      statusChanged = true;
      articleUpdateRequired = true;
    }

    // Update the article planning
    const updatedArticlePlanning = await ArticlePlanning.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { 
        new: true, // Return updated document
        runValidators: true,
        session 
      }
    );

    // Update associated article status if required
    if (articleUpdateRequired) {
      const article = await Article.findById(updatedArticlePlanning.article_id).session(session);
      if (article) {
        if (order_slip === "Received") {
          // When order slip is received, mark article as completed
          article.status = ARTICLE_ENUM_VALUES.STATUS_TYPES[3]; // "completed"
        } else if (order_slip === "Issued") {
          // When order slip is issued (after being completed), revert article to under process
          article.status = ARTICLE_ENUM_VALUES.STATUS_TYPES[1]; // "underProcess"
        }
        await article.save({ session });
      }
    }

    // Check if article planning is late after update
    if (allowedUpdates.when_process_end) {
      const currentDate = new Date();
      const processEndDate = new Date(updatedArticlePlanning.when_process_end);
      
      if (processEndDate < currentDate) {
        updatedArticlePlanning.late = true;
      } else {
        updatedArticlePlanning.late = false;
      }
    }

    await session.commitTransaction();

    return sendResponse(
      res,
      200,
      "Article planning updated successfully",
      updatedArticlePlanning
    );
  } catch (error) {
    await session.abortTransaction();
    throw createError(error.message, error.status || 500);
  } finally {
    session.endSession();
  }
};

// @desc    Update only order slip of article planning
// @route   PATCH /api/articlePlanning/:id/order-slip
// @access  Private
export const updateOrderSlip = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { order_slip } = req.body;

    // Validate input
    validateObjectId(id, "article planning id");

    if (!order_slip) {
      throw createError("Order slip is required", 400);
    }

    if (!articlePlanningEnumValues.ORDER_SLIP_TYPES.includes(order_slip)) {
      throw createError("Invalid order slip value", 400);
    }

    // Find article planning
    const articlePlanning = await ArticlePlanning.findById(id).session(session);
    if (!articlePlanning) {
      throw createError("Article planning not found", 404);
    }

    // Prevent updating to same order slip
    if (articlePlanning.order_slip === order_slip) {
      throw createError(`Order slip is already "${order_slip}"`, 400);
    }

    const updateData = { order_slip };
    let articleUpdateRequired = false;

    // 🎯 AUTOMATIC STATUS MANAGEMENT
    if (order_slip === "Received") {
      // When order slip is received, automatically complete the planning
      updateData.status = articlePlanningEnumValues.STATUS_TYPES[2]; // "completed"
      articleUpdateRequired = true;
    } else if (order_slip === "Issued" && articlePlanning.status === articlePlanningEnumValues.STATUS_TYPES[2]) {
      // When re-issuing order slip from completed state, revert to in progress
      updateData.status = articlePlanningEnumValues.STATUS_TYPES[1]; // "in progress"
      articleUpdateRequired = true;
    }

    // Update article planning
    const updatedArticlePlanning = await ArticlePlanning.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true,
        runValidators: true,
        session 
      }
    );

    // Update associated article status if required
    if (articleUpdateRequired) {
      const article = await Article.findById(updatedArticlePlanning.article_id).session(session);
      if (article) {
        if (order_slip === "Received") {
          article.status = ARTICLE_ENUM_VALUES.STATUS_TYPES[3]; // "completed"
        } else if (order_slip === "Issued") {
          article.status = ARTICLE_ENUM_VALUES.STATUS_TYPES[1]; // "underProcess"
        }
        await article.save({ session });
      }
    }

    await session.commitTransaction();

    return sendResponse(
      res,
      200,
      `Order slip updated to "${order_slip}" successfully`,
      updatedArticlePlanning
    );
  } catch (error) {
    await session.abortTransaction();
    throw createError(error.message, error.status || 500);
  } finally {
    session.endSession();
  }
};

// @desc    Update only status of article planning
// @route   PATCH /api/articlePlanning/:id/status
// @access  Private
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate input
    validateObjectId(id, "article planning id");

    if (!status) {
      throw createError("Status is required", 400);
    }

    if (!articlePlanningEnumValues.STATUS_TYPES.includes(status)) {
      throw createError("Invalid status value", 400);
    }

    // Update status
    const updatedArticlePlanning = await ArticlePlanning.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedArticlePlanning) {
      throw createError("Article planning not found", 404);
    }

    return sendResponse(
      res,
      200,
      `Status updated to "${status}" successfully`,
      updatedArticlePlanning
    );
  } catch (error) {
    throw createError(error.message, error.status || 500);
  }
};

// @desc    Delete article planning
// @route   DELETE /api/articlePlanning/:id
// @access  Private
export const deleteArticlePlanning = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Validate input
    validateObjectId(id, "article planning id");

    // Find and delete article planning
    const deletedArticlePlanning = await ArticlePlanning.findByIdAndDelete(id).session(session);
    
    if (!deletedArticlePlanning) {
      throw createError("Article planning not found", 404);
    }

    // Update associated article status to 'draft' if it was 'underProcess'
    const article = await Article.findById(deletedArticlePlanning.article_id).session(session);
    if (article && article.status === ARTICLE_ENUM_VALUES.STATUS_TYPES[1]) {
      article.status = ARTICLE_ENUM_VALUES.STATUS_TYPES[0]; // Set to 'draft'
      await article.save({ session });
    }

    await session.commitTransaction();

    return sendResponse(
      res,
      200,
      `Article planning with id ${id} deleted successfully`,
      deletedArticlePlanning
    );
  } catch (error) {
    await session.abortTransaction();
    throw createError(error.message, error.status || 500);
  } finally {
    session.endSession();
  }
};