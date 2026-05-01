// ---------------------------------------------------------------------------
// server/routes/expenses.js  —  All the API endpoints for this app.
//
// An "endpoint" (or "route") is a URL that the React front-end can send
// HTTP requests to. The server responds with JSON data.
//
// HTTP verbs used here:
//   GET    — read/fetch data
//   POST   — create new data
//   PATCH  — partially update existing data
//   DELETE — remove data
// ---------------------------------------------------------------------------

const express = require('express');

// Multer handles multipart/form-data (file uploads).
// Without it, Express can't read the binary CSV file sent from the browser.
const multer = require('multer');

// uuidv4 generates a random unique ID (e.g. "550e8400-e29b-41d4-a716-446655440000").
// We use this to group expenses that were uploaded in the same CSV batch.
const { v4: uuidv4 } = require('uuid');

// Import our Mongoose models so we can query the database.
const Expense = require('../models/Expense');
const CustomCategory = require('../models/CustomCategory');
const CategoryRule = require('../models/CategoryRule');

// Import our helper services.
const { parseCSV } = require('../services/csvParser');
const { categorizeExpenses } = require('../services/aiCategorizer');

// express.Router() creates a mini-app that handles a subset of routes.
// This router is mounted at /api/expenses in index.js.
const router = express.Router();

// ---------------------------------------------------------------------------
// Multer configuration for CSV uploads
// ---------------------------------------------------------------------------
// multer.memoryStorage() keeps the uploaded file in RAM (as a Buffer)
// instead of writing it to disk. Perfect for small files like CSVs.
const upload = multer({
  storage: multer.memoryStorage(),
  // fileFilter runs before the file is stored. cb(null, true) accepts the
  // file; cb(new Error(...), false) rejects it.
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Reject files larger than 5 MB.
});

// ---------------------------------------------------------------------------
// POST /api/expenses/upload
// The user uploads a CSV → server parses it → AI categorizes it → saved to DB.
// ---------------------------------------------------------------------------
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // upload.single('file') puts the uploaded file on req.file.
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Step 1: Parse the raw CSV buffer into an array of expense objects.
    // We wrap this in its own try/catch so parse errors can be flagged
    // separately and the front-end can show a helpful "reformat your CSV" hint.
    let parsed;
    try {
      parsed = parseCSV(req.file.buffer);
    } catch (parseErr) {
      return res.status(400).json({ error: parseErr.message, csvParseError: true });
    }
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no valid rows', csvParseError: true });
    }

    // Step 2: Load the user's saved category rules from the database.
    // ".lean()" returns plain JavaScript objects instead of Mongoose documents,
    // which is faster when you only need to read (not save) the data.
    const userRules = await CategoryRule.find(
      { userId: req.user.uid },
      { description: 1, originalDescription: 1, category: 1, _id: 0 }
    ).lean();

    // Step 3: Send the expenses to the AI for categorization.
    // Exact-match rules skip the AI call entirely (faster + cheaper).
    const categorized = await categorizeExpenses(parsed, userRules);

    // Step 4: Save all the categorized expenses to MongoDB in one bulk insert.
    // uuidv4() creates a unique batch ID shared by all expenses in this upload.
    const batchId = uuidv4();
    const docs = categorized.map((exp) => ({ ...exp, uploadBatch: batchId }));
    const saved = await Expense.insertMany(docs);

    // Respond with 201 Created and the saved expenses.
    res.status(201).json({ uploadBatch: batchId, count: saved.length, expenses: saved });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/expenses
// Returns all expenses, with optional filters and sorting.
// Query params:
//   category  - filter to one category (e.g. ?category=Transport)
//   batch     - filter to one upload batch
//   sortBy    - which field to sort by (default: 'date')
//   order     - 'asc' or 'desc' (default: 'desc')
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    // req.query contains the URL query string parsed into an object.
    // e.g. /api/expenses?category=Food becomes { category: 'Food' }
    const { category, batch, sortBy = 'date', order = 'desc' } = req.query;

    // Build a MongoDB filter object dynamically based on what was provided.
    const filter = {};
    if (category) filter.category = category;
    if (batch) filter.uploadBatch = batch;

    // MongoDB sort uses 1 for ascending and -1 for descending.
    const sortOrder = order === 'asc' ? 1 : -1;

    // [sortBy] is computed property syntax — the key name comes from the variable.
    const expenses = await Expense.find(filter).sort({ [sortBy]: sortOrder });
    res.json(expenses);
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/expenses/categories
// Returns totals grouped by category (used to draw the pie chart).
// IMPORTANT: This route must appear BEFORE /:id so Express doesn't mistake
// "categories" for a MongoDB document ID.
// ---------------------------------------------------------------------------
router.get('/categories', async (req, res) => {
  try {
    const { batch } = req.query;
    // If a batch filter is provided, only aggregate that batch's expenses.
    const match = batch ? { uploadBatch: batch } : {};

    // MongoDB aggregation pipeline — think of it as a series of data
    // transformation steps applied one after another.
    const summary = await Expense.aggregate([
      // Stage 1: $match — filter down to only the documents we care about.
      { $match: match },
      // Stage 2: $group — group all expenses by category and sum their amounts.
      // _id is the "group by" field; total and count are computed values.
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },  // Sum all amounts in this category.
          count: { $sum: 1 },          // Count how many expenses are in it.
        },
      },
      // Stage 3: $sort — sort by total descending (biggest spender first).
      { $sort: { total: -1 } },
    ]);

    // Reshape the result to have cleaner field names.
    // Math.round(x * 100) / 100 rounds to 2 decimal places.
    const result = summary.map((item) => ({
      category: item._id,
      total: Math.round(item.total * 100) / 100,
      count: item.count,
    }));

    res.json(result);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/expenses/batches
// Returns a list of all upload batches (each CSV upload = one batch).
// Used by the Bookshelf component to show one "book" per upload.
// Sorted oldest-first so books appear left-to-right in chronological order.
// ---------------------------------------------------------------------------
router.get('/batches', async (req, res) => {
  try {
    const batches = await Expense.aggregate([
      {
        $group: {
          _id: '$uploadBatch',         // Group by the batch UUID.
          date: { $first: '$date' },   // Grab the date from the first expense in the batch.
          count: { $sum: 1 },          // Count total expenses in this batch.
          createdAt: { $min: '$createdAt' }, // Earliest createdAt = upload time.
        },
      },
      { $sort: { createdAt: 1 } },     // Sort ascending so oldest is first.
    ]);
    res.json(
      batches.map((b) => ({
        uploadBatch: b._id,
        date: b.date,
        count: b.count,
      }))
    );
  } catch (err) {
    console.error('Batches error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/expenses/months
// Returns a list of distinct year-month values that have expenses.
// Used by the "Delete by Month" modal to show which months can be deleted.
// ---------------------------------------------------------------------------
router.get('/months', async (req, res) => {
  try {
    const months = await Expense.aggregate([
      {
        $group: {
          // $substr extracts the first 7 characters of the date string ("YYYY-MM").
          // e.g. "2024-01-15" becomes "2024-01".
          _id: { $substr: ['$date', 0, 7] },
          count: { $sum: 1 }, // How many expenses exist for this month.
        },
      },
      { $sort: { _id: -1 } }, // Most recent month first.
    ]);
    res.json(months.map((m) => ({ month: m._id, count: m.count })));
  } catch (err) {
    console.error('Months error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/expenses/by-month/:month
// Deletes all expenses whose date falls within a given month.
// :month is a URL parameter — e.g. /api/expenses/by-month/2024-01
// ---------------------------------------------------------------------------
router.delete('/by-month/:month', async (req, res) => {
  try {
    // req.params contains URL segment values (the :month part).
    const { month } = req.params;

    // Validate the format is exactly YYYY-MM before touching the database.
    // \d{4} = exactly 4 digits, \d{2} = exactly 2 digits.
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM.' });
    }

    // $regex matches all dates that START with "YYYY-MM".
    // The ^ anchor means "beginning of string".
    const result = await Expense.deleteMany({
      date: { $regex: `^${month}` },
    });
    res.json({ message: `Deleted ${result.deletedCount} expense(s) for ${month}`, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Delete by month error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/expenses/:id
// Changes the category of one expense AND saves a rule so the AI remembers
// this correction for future uploads.
//
// This is triggered every time the user picks a category from the dropdown
// in the expense table.
// ---------------------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  try {
    // req.body is the JSON sent by the client (e.g. { category: "Transport" }).
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }

    // findByIdAndUpdate finds the document by its MongoDB _id and applies
    // the update. { new: true } means return the updated document (not the old one).
    // runValidators: true re-runs the schema validation on the new values.
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: { category } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Save the user's correction as an AI rule for future uploads.
    // We normalize the description to lowercase so matching is case-insensitive.
    const normalizedDesc = updated.description.toLowerCase().trim();

    // findOneAndUpdate with { upsert: true } means:
    //   - If a rule already exists for this user + description → update it.
    //   - If no rule exists yet → create a new one.
    // This prevents duplicate rules from building up.
    await CategoryRule.findOneAndUpdate(
      { userId: req.user.uid, description: normalizedDesc },
      {
        userId: req.user.uid,
        description: normalizedDesc,
        originalDescription: updated.description,
        category,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/expenses/:id
// Permanently removes one expense from the database.
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    // findByIdAndDelete finds by _id and removes it in one step.
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// AI Category Rules Routes
// ============================================

// ---------------------------------------------------------------------------
// GET /api/expenses/rules
// Returns all saved AI rules for the currently signed-in user.
// Displayed in the "AI Memory" modal.
// ---------------------------------------------------------------------------
router.get('/rules', async (req, res) => {
  try {
    // req.user.uid is set by the auth middleware — it's the Firebase user ID.
    const rules = await CategoryRule.find({ userId: req.user.uid }).sort({ updatedAt: -1 });
    res.json(rules);
  } catch (err) {
    console.error('Fetch rules error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/expenses/rules/:id
// Removes one AI rule. Scoped to the current user so users can't delete
// each other's rules.
// ---------------------------------------------------------------------------
router.delete('/rules/:id', async (req, res) => {
  try {
    // We match BOTH _id AND userId so a user can only delete their own rules.
    const deleted = await CategoryRule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.uid,
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json({ message: 'Rule deleted', id: req.params.id });
  } catch (err) {
    console.error('Delete rule error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Custom Categories Routes
// ============================================

// ---------------------------------------------------------------------------
// GET /api/expenses/custom-categories
// Returns all user-created categories sorted alphabetically.
// ---------------------------------------------------------------------------
router.get('/custom-categories', async (req, res) => {
  try {
    // sort({ name: 1 }) sorts alphabetically (1 = ascending).
    const customCats = await CustomCategory.find().sort({ name: 1 });
    res.json(customCats);
  } catch (err) {
    console.error('Fetch custom categories error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/expenses/custom-categories
// Creates a new custom category with a name and color.
// ---------------------------------------------------------------------------
router.post('/custom-categories', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !color) {
      return res.status(400).json({ error: 'name and color are required' });
    }

    // Create a new Mongoose document instance and save it to the database.
    const customCat = new CustomCategory({ name, color });
    const saved = await customCat.save();
    res.status(201).json(saved);
  } catch (err) {
    // MongoDB error code 11000 means a duplicate key (unique constraint violated).
    // This happens if the user tries to create a category that already exists.
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    console.error('Create custom category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/expenses/custom-categories/:name
// Removes a custom category AND reassigns all its expenses to "Other".
// ---------------------------------------------------------------------------
router.delete('/custom-categories/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const deleted = await CustomCategory.findOneAndDelete({ name });
    if (!deleted) {
      return res.status(404).json({ error: 'Custom category not found' });
    }
    // Prevent orphaned expenses — move them all to the built-in "Other" category.
    // updateMany updates every matching document in one database operation.
    await Expense.updateMany({ category: name }, { $set: { category: 'Other' } });
    res.json({ message: 'Custom category deleted', name });
  } catch (err) {
    console.error('Delete custom category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export the router so index.js can mount it.
module.exports = router;
