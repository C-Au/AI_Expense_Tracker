const mongoose = require('mongoose');

const categoryRuleSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    // Normalized (lowercased + trimmed) for fast exact matching
    description: { type: String, required: true },
    // Original casing for display in the UI
    originalDescription: { type: String, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

// One rule per user + description pair — enables clean upserts
categoryRuleSchema.index({ userId: 1, description: 1 }, { unique: true });

module.exports = mongoose.model('CategoryRule', categoryRuleSchema);
