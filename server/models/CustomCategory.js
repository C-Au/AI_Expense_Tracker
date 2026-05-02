// ---------------------------------------------------------------------------
// server/models/CustomCategory.js  —  User-created spending categories.
//
// Beyond the built-in categories (Food & Dining, Transport, etc.), users
// can create their own (e.g. "Pet Care", "Subscriptions"). This model
// stores the name and a hex color for each custom category.
// ---------------------------------------------------------------------------
const mongoose = require('mongoose');

const customCategorySchema = new mongoose.Schema(
  {
    // The category name shown in dropdowns and filters.
    name: {
      type: String,
      required: true,
      unique: true,       // No two categories can have the same name.
      trim: true,         // Strip accidental leading/trailing spaces.
      minlength: 1,       // Must be at least 1 character.
      maxlength: 50,      // Can't be longer than 50 characters.
    },

    // The display color used in the chart and filter pills.
    // Must be a valid 6-digit hex color (e.g. "#ff6b6b").
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-Fa-f]{6}$/, // Regex: validates hex color format.
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomCategory', customCategorySchema);
