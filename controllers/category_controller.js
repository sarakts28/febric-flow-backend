import mongoose from "mongoose";
import Category from "../models/category_modal.js";
import createError from "../utilies/errorHandle.js";
import {
  createdResponse,
  noContentResponse,
  successResponse,
} from "../utilies/responseHandler.js";
import { CategoryEnumValues } from "../constant/enum_contants.js";

// @desc    Create a new Category
// @route   POST /api/Category
// @access  Private

export const createCategory = async (req, res) => {
  if (!req.body) {
    throw createError("Request body is required", 400);
  }
  const { category_name, category_season } = req.body;
  if (!category_name || !category_season) {
    throw createError("Category name and season are required", 400);
  }

  const findCategory = await Category.findOne({ category_name });
  if (findCategory) {
    throw createError("Category already exists", 400);
  }

  const isSeasonExist =
    CategoryEnumValues.SEASON_TYPES.includes(category_season);
  if (!isSeasonExist) {
    throw createError(
      "Invalid season only " +
        CategoryEnumValues.SEASON_TYPES.join(", ") +
        " are allowed",
      400
    );
  }
  try {
    const newCategory = new Category({
      category_name,
      category_season,
      user: req.user._id,
    });
    await newCategory.save();
    return createdResponse(res, "Category created successfully", newCategory);
  } catch (error) {
    throw createError(error.message, 500);
  }
};

// @desc    Get all Categorys and simple search on the base of Category name and Category email
// @route   GET /api/Category
// @access  Private
export const getAllCategorys = async (req, res) => {
  let page_limit = parseInt(req.query.page_limit) || 10;
  let page = parseInt(req.query.page) || 1;

  const { search } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { category_name: { $regex: search, $options: "i" } },
      { category_season: { $regex: search, $options: "i" } },
    ];
  }
  const skip = (page - 1) * page_limit;
  const allCategorysCount = await Category.countDocuments(query);

  const Categorys = await Category.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(page_limit);
  const totalPages = Math.ceil(allCategorysCount / page_limit);

  if (page > 1 && page > totalPages) {
    throw createError(
      `Page ${page} does not exist. Maximum page is ${totalPages + 1}`,
      400
    );
  }

  const data = {
    result: Categorys,
    totalCount: allCategorysCount,
    pagination: {
      current_page: page,
      page_limit: page_limit,
      total_pages: Math.ceil(allCategorysCount / page_limit),
      total_items: allCategorysCount,
      isNext: page < Math.ceil(allCategorysCount / page_limit),
      isPrev: page > 1,
    },
  };

  return successResponse(res, "Categorys fetched successfully", data);
};

// @desc get all categories without pagination
// @route GET /api/Category/all
// @access Private
export const getAllCategorysWithoutPagination = async (req, res) => {
  const Categorys = await Category.find();
  return successResponse(res, "Categorys fetched successfully", Categorys);
};

// @desc delete category by id
// @route DELETE /api/Category/:id
// @access Private

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError("Invalid category id", 400);
  }
  const Categories = await Category.findByIdAndDelete(id);
  if (!Categories) {
    throw createError("Category not found", 404);
  }
  return noContentResponse(res, "Category deleted successfully");
};
