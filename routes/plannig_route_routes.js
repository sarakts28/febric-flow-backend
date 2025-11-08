import express from "express";
import { createPlanningRoute, getAllPlanningRoutes, getSinglePlanningRoute, updatePlanningRoute, deletePlanningRoute } from "../controllers/planning_route_controller.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import { roleEnumValues } from "../constant/enum_contants.js";

const router = express.Router();

// Only admin and designer can access these routes
const adminAndDesigner = checkRole([roleEnumValues.ROLE_TYPES[0], roleEnumValues.ROLE_TYPES[1]]);
const adminOnly = checkRole([roleEnumValues.ROLE_TYPES[0]]);



router.post("/", protect, adminOnly, createPlanningRoute);
router.get("/", protect, adminAndDesigner, getAllPlanningRoutes);
router.get("/:id", protect, adminAndDesigner, getSinglePlanningRoute);
router.patch("/:id", protect, adminOnly, updatePlanningRoute);
router.delete("/:id", protect, adminOnly, deletePlanningRoute);

export default router;
