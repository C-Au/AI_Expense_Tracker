# Expense.js Notes

## File Overview
`server/models/Expense.js` — The "shape" of an expense in the database.

Mongoose uses "schemas" to define what fields a document can have and what type of data each field holds. Think of it like a form template. Every expense saved to MongoDB must match this schema.

## Schema Fields

| Field | Type | Notes |
|---|---|---|
| `date` | String | The date the expense occurred (e.g. `"2024-01-15"`). Required. |
| `description` | String | A short description of the expense (e.g. `"Whole Foods Market"`). Required. `trim: true` automatically strips leading/trailing spaces. |
| `amount` | Number | The dollar amount (e.g. `87.43`). Required. |
| `category` | String | Which spending category this belongs to. Defaults to `'Other'` if the AI can't confidently classify it. |
| `uploadBatch` | String | A UUID that groups all expenses uploaded in the same CSV together. Lets the Bookshelf component show per-upload history. |
| `userId` | String | The Firebase UID of the user who owns this expense. Scopes all queries so users only see their own data. |

`{ timestamps: true }` tells Mongoose to automatically add `createdAt` and `updatedAt` fields to every document.

## Model Export
The first argument to `mongoose.model()` (`'Expense'`) is the collection name in MongoDB. Mongoose pluralizes it to `'expenses'` automatically.
