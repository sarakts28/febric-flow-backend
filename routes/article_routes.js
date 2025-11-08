import express from "express";
import { 
  createArticle, 
  getAllArticles, 
  getSingleArticle, 
  updateArticle, 
  deleteArticle, 
  getRawArticles 
} from "../controllers/article_controller.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import { roleEnumValues } from "../constant/enum_contants.js";

const router = express.Router();

// Only admin and designer can access these routes
const adminAndDesigner = checkRole([roleEnumValues.ROLE_TYPES[0], roleEnumValues.ROLE_TYPES[1]]);

// Apply role-based middleware to all article routes
router.use(protect, adminAndDesigner);

router.post("/", createArticle);
router.patch("/:id", updateArticle);
router.get("/", getAllArticles);
router.get("/raw", getRawArticles);
router.get("/:id", getSingleArticle);
router.delete("/:id", deleteArticle);

export default router;
