import asyncHandler from "express-async-handler";
import Article from "../models/article_modal.js";
import Category from "../models/category_modal.js";
import createError from "../utilies/errorHandle.js";
import mongoose from "mongoose";
import getEnumErrorMessage from "../utilies/getEnumErrorMessage.js";
import { ARTICLE_ENUM_VALUES } from "../constant/enum_contants.js";
import {
  createdResponse,
  noContentResponse,
  successResponse,
} from "../utilies/responseHandler.js";

// @desc    Create article
// @route   POST /api/article
// @access  Private
const createArticle = asyncHandler(async (req, res) => {
  // Check user role
  if (!req.body) {
    throw createError("Request body is required", 400);
  }

  const {
    article_no,
    article_name,
    article_description,
    category_id,
    fabric_type,
    measurement_type,
    total_quantity,
    designer_name,
    price,
    status,
    article_images,
  } = req.body;

  // Validate required fields
  const requiredFields = [
    "article_no",
    "article_name",
    "article_description",
    "category_id",
    "fabric_type",
    "measurement_type",
    "total_quantity",
    "price",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length > 0) {
    throw createError(
      `Missing required fields: ${missingFields.join(", ")}`,
      400
    );
  }

  // Pre-validate enum values with detailed error messages
  if (
    category_id &&
    ((category_id !== "" && !mongoose.Types.ObjectId.isValid(category_id)) ||
      !(await Category.findById(category_id)))
  ) {
    throw createError("Invalid Category ID", 400);
  }

  if (fabric_type && !ARTICLE_ENUM_VALUES.FABRIC_TYPES.includes(fabric_type)) {
    throw createError(
      getEnumErrorMessage(
        "Fabric type",
        fabric_type,
        ARTICLE_ENUM_VALUES.FABRIC_TYPES
      ),
      400
    );
  }

  if (
    measurement_type &&
    !ARTICLE_ENUM_VALUES.MEASUREMENT_TYPES.includes(measurement_type)
  ) {
    throw createError(
      getEnumErrorMessage(
        "Measurement type",
        measurement_type,
        ARTICLE_ENUM_VALUES.MEASUREMENT_TYPES
      ),
      400
    );
  }

  if (status && !ARTICLE_ENUM_VALUES.STATUS_TYPES.includes(status)) {
    throw createError(
      getEnumErrorMessage("Status", status, ARTICLE_ENUM_VALUES.STATUS_TYPES),
      400
    );
  }

  // ✅ ONLY check if article number already exists (article_name can be duplicate)
  const existingArticle = await Article.findOne({ article_no });
  if (existingArticle) {
    throw createError(
      `Article with this number already exists ${article_no}`,
      400
    );
  }

  // Create article design with proper error handling
  try {
    const newArticle = await Article.create({
      user: req.user._id,
      article_no,
      article_name,
      article_description,
      article_images,
      category_id,
      fabric_type,
      measurement_type,
      total_quantity,
      designer_name:
        designer_name ||
        (req.user.userType === "designer" ? req.user.name : ""),
      price,
      status,
    });

    return createdResponse(
      res,
      "Article design created successfully",
      newArticle
    );
  } catch (error) {
    // Handle Mongoose validation errors (fallback)
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map((err) => err.message);
      throw createError(`Validation failed: ${errors.join(", ")}`, 400);
    }

    // Handle duplicate key error for article_no (fallback protection)
    if (error.code === 11000) {
      throw createError("Article number already exists", 400);
    }

    // Re-throw the error if it's not a validation error
    throw error;
  }
});

// @desc    Get all articles
// @route   GET /api/article
// @access  Private
const getAllArticles = asyncHandler(async (req, res) => {
  let filter = {};
  let page_limit = parseInt(req.query.limit) || 10;
  let page = parseInt(req.query.page) || 1;

  if (req.user.userType === "designer") {
    filter.user = req.user._id;
  }

  // ✅ AND Logic: All query parameters must match
  const { status, article_no, fabric_type, search } = req.query;

  if (status) {
    filter.status = status;
  }

  if (article_no) {
    filter.article_no = { $regex: article_no, $options: "i" }; // Case-insensitive search
  }

  if (fabric_type) {
    filter.fabric_type = fabric_type;
  }

  // ✅ Search across multiple fields (OR logic within AND)
  if (search) {
    filter.$or = [
      { article_name: { $regex: search, $options: "i" } },
      { designer_name: { $regex: search, $options: "i" } },
    ];
  }

  // ✅ FIXED: Proper MongoDB pagination (not JavaScript slicing)
  const skip = (page - 1) * page_limit;

  const articles = await Article.find(filter)
    .populate("user", "name email userType")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(page_limit);

  const allArticlesCount = await Article.countDocuments(filter);
  const totalPages = Math.ceil(allArticlesCount / page_limit);

  // Check if requested page exceeds total pages
  if (page > 1 && page > totalPages) {
    throw createError(
      `Page ${page} does not exist. Maximum page is ${totalPages + 1}`,
      400
    );
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  // Format response
  const formattedArticles = articles.map((article) => ({
    user_info: {
      _id: article.user._id,
      name: article.user.name,
      email: article.user.email,
      userType: article.user.userType,
    },
    article_info: {
      _id: article._id,
      article_no: article.article_no,
      article_name: article.article_name,
      article_description: article.article_description,
      active_status: article.active_status,
      article_images: (article.article_images || []).map((img) => ({
        url: `${baseUrl}${img.url}`,
        is_primary: img.is_primary,
      })),
      category_type: article.category_type,
      designer_name: article.designer_name,
      fabric_type: article.fabric_type,
      measurement_type: article.measurement_type,
      price: article.price,
      status: article.status,
      total_quantity: article.total_quantity,
      total_stores_assigned: article.total_stores_assigned,
      total_quantity_dispatched: article.total_quantity_dispatched,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    },
  }));

  const data = {
    count: allArticlesCount,
    result: formattedArticles,
    pagination: {
      current_page: page,
      page_limit: page_limit,
      total_pages: Math.ceil(allArticlesCount / page_limit),
      total_items: allArticlesCount,
      isNext: page < Math.ceil(allArticlesCount / page_limit),
      isPrev: page > 1,
    },
  };

  return successResponse(res, "Articles fetched successfully", data);
});

// @desc    Get single article
// @route   GET /api/article/:id
// @access  Private
const getSingleArticle = asyncHandler(async (req, res) => {
  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw createError("Invalid article ID format", 400);
  }

  const article = await Article.findById(req.params.id);

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (!article) {
    throw createError("Article not found", 404);
  }

  const articleWithUrls = {
    ...article._doc,
    article_images: (article.article_images || []).map((img) => ({
      url: `${baseUrl}${img.url}`,
      is_primary: img.is_primary,
    })),
  };
  return successResponse(res, "Article fetched successfully", articleWithUrls);
});

// @desc  Get only raw articles
// @route   GET /api/article/raw
// @access  Private
const getRawArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find({
    status: ARTICLE_ENUM_VALUES.STATUS_TYPES[0],
  });

  const data = {
    count: articles.length,
    result: articles,
  };

  return successResponse(
    res,
    "Articles with status 'raw' fetched successfully",
    data
  );
});

//@desc    Update article only admin/designer and can update article status, actricle image, total stores assigned and total quantity dispatched
//@route   PUT /api/article/:id
//@access  Private
const updateArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError("Invalid article ID", 400);
  }

  let article = await Article.findById(id);
  if (!article) {
    throw createError("Article not found", 404);
  }

  // Only allowed fields to update
  const allowedKeys = [
    "status",
    "active_status",
    "total_stores_assigned",
    "total_quantity_dispatched",
  ];
  const keys = Object.keys(req.body);

  if (keys.some((key) => !allowedKeys.includes(key))) {
    throw createError(
      "Only status, active_status, total_stores_assigned, total_quantity_dispatched are allowed to update",
      400
    );
  }

  // Check if active_status is false but status is not Finished
  if (
    req.body.active_status === false &&
    req.body.status !== ARTICLE_ENUM_VALUES.STATUS_TYPES[2]
  ) {
    throw createError(
      "Article status must be Finished because active status is false",
      400
    );
  }

  // Handle uploaded images
  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    uploadedImages = req.files.map((file) => ({
      url: `/uploads/articles/${file.filename}`,
      is_primary: article.article_images?.length === 0 ? true : false, // First image as primary
    }));
  }

  // Merge existing images with new ones
  const updates = { ...req.body };
  if (uploadedImages.length > 0) {
    updates.article_images = [
      ...(article.article_images || []),
      ...uploadedImages,
    ];
  }

  // Update the article
  article = await Article.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, "Article updated successfully", article);
});

// @desc    Delete article
// @route   DELETE /api/article/:id
// @access  Private
const deleteArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw createError("Article id is required", 400);
  }

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError("Invalid article ID format", 400);
  }

  const article = await Article.findByIdAndDelete(id);
  if (!article) {
    throw createError("Article not found", 404);
  }

  return noContentResponse(res, "Article deleted successfully");
});

export {
  createArticle,
  getAllArticles,
  getSingleArticle,
  updateArticle,
  deleteArticle,
  getRawArticles,
};
