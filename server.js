import express from "express";
import endPoints from "./endpoints.js";
import { configDotenv } from "dotenv";
import errorHandleMiddleware from "./middleware/errorMiddleWare.js";
import validationErrorHandler from "./middleware/validationMiddleware.js";
import connectDB from "./config/db.js";
<<<<<<< HEAD
import { userRoutes, articleDesignRoutes, planningRouteRoutes,  category_routes, articlePlanningRoutes } from "./routes/index.js";
=======
import {
  userRoutes,
  articleDesignRoutes,
  planningRouteRoutes,
  clientRoutes,
} from "./routes/index.js";
>>>>>>> a634010fa88900099455f55ff17baf3f587f133d
import cookieParser from "cookie-parser";
import cors from "cors";
configDotenv();
connectDB();

const port = process.env.PORT || 5000; // Add default port

const app = express();

<<<<<<< HEAD
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

=======
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
>>>>>>> a634010fa88900099455f55ff17baf3f587f133d


app.use(cookieParser());
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use(endPoints.articleDesign, articleDesignRoutes);
app.use(endPoints.planningRoute, planningRouteRoutes);
<<<<<<< HEAD
app.use(endPoints.category, category_routes);
app.use(endPoints.articlePlanning, articlePlanningRoutes);
app.use('/api', userRoutes);

=======
app.use(endPoints.clients, clientRoutes);
app.use("/api", userRoutes);
>>>>>>> a634010fa88900099455f55ff17baf3f587f133d

// Error handling middlewares (order is important)
app.use(validationErrorHandler);
app.use(errorHandleMiddleware);

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
