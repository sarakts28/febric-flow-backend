// category_modal.js
import mongoose from "mongoose";
import { CategoryEnumValues } from "../constant/enum_contants.js";


const CategorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  category_name: {
    type: String,
    required: true, // e.g., "Lawn", "Cotton"
    trim: true
  },
  category_season: {
    type: String,
    enum: CategoryEnumValues.SEASON_TYPES,
    default: CategoryEnumValues.SEASON_TYPES[0] // default "Summer"
  }
}, { timestamps: true })

const Category = mongoose.model("Category", CategorySchema);

export default Category;