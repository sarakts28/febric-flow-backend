import express from "express";
import { createClient, getAllClients } from "../controllers/client_controller.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import { roleEnumValues } from "../constant/enum_contants.js";

const router = express.Router();

const admin = checkRole([roleEnumValues.ROLE_TYPES[0]]);
const adminAndUser = checkRole([roleEnumValues.ROLE_TYPES[0], roleEnumValues.ROLE_TYPES[1]]);

// Both routes are protected and require authentication
router.post("/", protect, admin, createClient);
router.get("/", protect, adminAndUser, getAllClients);

export default router;