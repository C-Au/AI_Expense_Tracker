const mongoose = require('mongoose');

const customCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-Fa-f]{6}$/, // Validate hex color
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomCategory', customCategorySchema);
