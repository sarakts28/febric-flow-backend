import mongoose from "mongoose";
import { ARTICLE_ENUM_VALUES } from "../constant/enum_contants.js";
// final article in market
const articleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    article_no: {
        type: String,
        required: [true, "Article number is required"],
        unique: true,
        trim: true,
        maxlength: [50, "Article number cannot exceed 50 characters"]
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    article_name: {
        type: String,
        required: [true, "Article name is required"],
        trim: true,
        maxlength: [100, "Article name cannot exceed 100 characters"]
    },
    article_description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    article_images: [{
        url: {
            type: String,
            required: true,
            validate: {
                validator: function(url) {
                    return url.startsWith('http') || url.startsWith('/uploads/');
                },
                message: 'Image URL must be a valid URL or file path'
            }
        },
        is_primary: {
            type: Boolean,
            default: false
        }
    }],
    fabric_type: {
        type: String,
        required: true,
        enum: {
            values: ARTICLE_ENUM_VALUES.FABRIC_TYPES,
            message: '{VALUE} is not a valid fabric type'
        }
    },
    measurement_type: {
        type: String,
        required: true,
        enum: {
            values: ARTICLE_ENUM_VALUES.MEASUREMENT_TYPES,
            message: '{VALUE} is not a valid measurement type'
        }
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ARTICLE_ENUM_VALUES.STATUS_TYPES,
            message: '{VALUE} is not a valid status'
        },
        default: ARTICLE_ENUM_VALUES.STATUS_TYPES[0]
    },
    active_status: {
        type: Boolean,
        default: true
    },
    total_quantity: {
        type: Number,
        required: true,
        min: [0, "Quantity cannot be negative"],
        validate: {
            validator: Number.isInteger,
            message: 'Quantity must be an integer'
        }
    },
    total_stores_assigned: {
        type: Number,
        required: true,
        min: [0, "Stores assigned cannot be negative"],
        validate: {
            validator: Number.isInteger,
            message: 'Stores assigned must be an integer'
        },
        default: 0
    },
    total_quantity_dispatched: {
        type: Number,
        required: true,
        min: [0, "Quantity dispatched cannot be negative"],
        validate: {
            validator: Number.isInteger,
            message: 'Quantity dispatched must be an integer'
        },
        default: 0
    },
    designer_name: {
        type: String,
        trim: true,
        maxlength: [100, "Designer name cannot exceed 100 characters"]
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
}, { 
    timestamps: true 
});

export default mongoose.model("Article", articleSchema);