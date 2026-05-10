# CustomCategory.js Notes

## File Overview
`server/models/CustomCategory.js` — User-created spending categories.

Beyond the built-in categories (Food & Dining, Transport, etc.), users can create their own (e.g. "Pet Care", "Subscriptions"). This model stores the name and a hex color for each custom category.

## Schema Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `name` | String | required, unique, trim, minlength: 1, maxlength: 50 | The category name shown in dropdowns and filters. `unique: true` prevents two categories with the same name. `trim: true` strips accidental leading/trailing spaces. |
| `color` | String | required, match regex | The display color used in the chart and filter pills. Must be a valid 6-digit hex color (e.g. `"#ff6b6b"`). |

### Color Validation
The `match` regex `/^#[0-9A-Fa-f]{6}$/` validates the hex color format — ensures it's exactly a `#` followed by 6 hex characters.

`{ timestamps: true }` automatically adds `createdAt` and `updatedAt` fields.
