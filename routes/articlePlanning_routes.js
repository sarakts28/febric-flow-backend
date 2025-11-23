import express from "express";
import {
  createArticlePlanning,
  getAllArticlePlannings,
} from "../controllers/articlePlanning_controller.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import { roleEnumValues } from "../constant/enum_contants.js";

const router = express.Router();

// Only admin and designer can access these routes
const adminAndDesigner = checkRole([
  roleEnumValues.ROLE_TYPES[0],
  roleEnumValues.ROLE_TYPES[1],
]);

router.use(protect, adminAndDesigner);

router.post("/", createArticlePlanning);
// router.patch("/:id", updateArticlePlanning);
router.get("/", getAllArticlePlannings);
// router.get("/:id", getSingleArticlePlanning);
// router.delete("/:id", deleteArticlePlanning);

export default router;
