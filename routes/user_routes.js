import { Router } from "express";
import { register, login, getMe, refreshToken, logout } from "../controllers/user_controller.js";
import protect from "../middleware/authMiddleware.js";


const routes = Router();


routes.post("/register", register);
routes.post("/login", login);
routes.get("/me", protect, getMe);
routes.post("/refresh", refreshToken);
routes.post("/logout", logout);

export default routes;
