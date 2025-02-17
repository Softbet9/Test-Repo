const mongoose = require("mongoose");

// Schema for an individual route
const routeSchema = new mongoose.Schema({
  sequence_id: { type: Number, required: true },
  name: { type: String, required: true }, // Route display name
  link: { type: String, required: true }, // Path to the route
  enabled: { type: Boolean, required: true, default: false }, // Access status
});

// Schema for user_routes
const userRoutesSchema = new mongoose.Schema(
  {
    // user_id: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // }, // Link to the user
    user_type: { type: String, required: true }, // User type (e.g., 'admin', 'user')
    routing_path: { type: [routeSchema], required: true }, // Array of routes
  },
//   { timestamps: true }
); // Automatically adds createdAt and updatedAt fields

// Create the model
const UserRoutes = mongoose.model("UserRoutes", userRoutesSchema);

module.exports = UserRoutes;
