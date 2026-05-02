// ---------------------------------------------------------------------------
// server/models/CategoryRule.js  —  Stores the AI's "memory" per user.
//
// When a user manually reassigns an expense to a different category,
// that correction is saved here as a rule. The next time the same
// expense description appears in a CSV, the AI will skip asking the
// model and apply the saved rule immediately.
//
// Example rule: { description: "whole foods market", category: "Food & Dining" }
// ---------------------------------------------------------------------------
const mongoose = require('mongoose');

const categoryRuleSchema = new mongoose.Schema(
  {
    // The Firebase user ID (uid) that owns this rule.
    // Rules are per-user so one user's preferences don't affect another.
    userId: { type: String, required: true },

    // Normalized (lowercased + trimmed) for fast exact matching.
    // We compare incoming descriptions against this normalized version.
    description: { type: String, required: true },

    // Original casing for display in the UI (the AI Memory modal).
    // Keeps "Whole Foods Market" readable instead of "whole foods market".
    originalDescription: { type: String, required: true },

    // The category the user wants this description to map to.
    category: { type: String, required: true },
  },
  { timestamps: true }
);

// Create a compound index on userId + description.
// "unique: true" means one user can only have ONE rule per description.
// This makes "upsert" operations safe — updating instead of duplicating.
categoryRuleSchema.index({ userId: 1, description: 1 }, { unique: true });

module.exports = mongoose.model('CategoryRule', categoryRuleSchema);
