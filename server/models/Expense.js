// ---------------------------------------------------------------------------
// server/models/Expense.js  —  The "shape" of an expense in the database.
//
// Mongoose uses "schemas" to define what fields a document can have and
// what type of data each field holds. Think of it like a form template.
// Every expense saved to MongoDB must match this schema.
// ---------------------------------------------------------------------------
const mongoose = require('mongoose');

// Define the schema (blueprint) for an expense document.
const expenseSchema = new mongoose.Schema(
  {
    // The date the expense occurred (stored as a string, e.g. "2024-01-15").
    date: {
      type: String,
      required: true,   // MongoDB will reject saves without this field.
    },

    // A short description of the expense (e.g. "Whole Foods Market").
    description: {
      type: String,
      required: true,
      trim: true,       // Automatically strips leading/trailing spaces.
    },

    // The dollar amount (stored as a number, e.g. 87.43).
    amount: {
      type: Number,
      required: true,
    },

    // Which spending category this belongs to (e.g. "Food & Dining").
    // Defaults to 'Other' if the AI can't confidently classify it.
    category: {
      type: String,
      required: true,
      default: 'Other',
    },

    // A UUID that groups all expenses uploaded in the same CSV together.
    // This lets us show per-upload history in the Bookshelf component.
    uploadBatch: {
      type: String,
      required: true,
    },
  },
  // { timestamps: true } tells Mongoose to automatically add
  // "createdAt" and "updatedAt" fields to every document.
  { timestamps: true }
);

// Create and export the Mongoose model.
// The first argument ('Expense') is the collection name in MongoDB
// (Mongoose pluralizes it to 'expenses' automatically).
module.exports = mongoose.model('Expense', expenseSchema);
