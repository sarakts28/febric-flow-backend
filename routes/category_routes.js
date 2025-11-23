// category_routes.js
import express from "express";
import { createCategory, getAllCategorys, getAllCategorysWithoutPagination, deleteCategory } from "../controllers/category_controller.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import { roleEnumValues } from "../constant/enum_contants.js";

const router = express.Router();

const admin = checkRole([roleEnumValues.ROLE_TYPES[0]]);
const adminAndUser = checkRole([roleEnumValues.ROLE_TYPES[0], roleEnumValues.ROLE_TYPES[1]]);

// Both routes are protected and require authentication
router.post("/", protect, admin, createCategory);
router.get("/", protect, adminAndUser, getAllCategorys);
router.get("/all", protect, adminAndUser, getAllCategorysWithoutPagination);
router.delete("/:id", protect, admin, deleteCategory);

export default router;