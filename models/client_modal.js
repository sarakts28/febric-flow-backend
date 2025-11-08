import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    client_name: { 
      type: String, 
      required: [true, "Client name is required"], 
      trim: true, 
      maxlength: [100, "Client name cannot be longer than 100 characters"],
      validate: { 
        validator: function(v) {
          // Allows letters, spaces, hyphens, and apostrophes only
          return /^[a-zA-Z\s'-]+$/.test(v);
        },
        message: "Client name can only contain letters, spaces, hyphens, and apostrophes"
      }
    },
    client_email: { 
      type: String, 
      required: [true, "Client email is required"], 
      trim: true, 
      lowercase: true,
      validate: {
        validator: function(v) {
          // Standard email regex pattern
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address"
      }
    },
    client_phone: { type: String, default: "" },
    client_address: { type: String, default: "" },
    client_city: { type: String, default: "" },
    client_state: { type: String, default: "" },
    client_zip: { type: String, default: "" },
    client_country: { type: String, default: "" },
    total_order_place: { type: Number, required: true, default: 0 },
    total_revenue: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const Client = mongoose.model("Client", clientSchema);

export default Client;
