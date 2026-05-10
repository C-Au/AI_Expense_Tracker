const mongoose = require("mongoose");

const categoryRuleSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },

    description: { type: String, required: true },

    originalDescription: { type: String, required: true },

    category: { type: String, required: true },
  },
  { timestamps: true },
);

categoryRuleSchema.index({ userId: 1, description: 1 }, { unique: true });

module.exports = mongoose.model("CategoryRule", categoryRuleSchema);
