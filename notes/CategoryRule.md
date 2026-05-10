# CategoryRule.js Notes

## File Overview
`server/models/CategoryRule.js` — Stores the AI's "memory" per user.

When a user manually reassigns an expense to a different category, that correction is saved here as a rule. The next time the same expense description appears in a CSV, the AI will skip asking the model and apply the saved rule immediately.

Example rule: `{ description: "whole foods market", category: "Food & Dining" }`

## Schema Fields

| Field | Type | Notes |
|---|---|---|
| `userId` | String | The Firebase user ID (uid) that owns this rule. Rules are per-user so one user's preferences don't affect another. |
| `description` | String | Normalized (lowercased + trimmed) for fast exact matching. Incoming descriptions are compared against this normalized version. |
| `originalDescription` | String | Original casing for display in the UI (the AI Memory modal). Keeps "Whole Foods Market" readable instead of "whole foods market". |
| `category` | String | The category the user wants this description to map to. |

`{ timestamps: true }` automatically adds `createdAt` and `updatedAt` fields.

## Index
A compound index on `userId + description` with `unique: true` means one user can only have ONE rule per description. This makes "upsert" operations safe — updating instead of duplicating.
