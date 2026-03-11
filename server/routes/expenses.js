const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Expense = require('../models/Expense');
const { parseCSV } = require('../services/csvParser');
const { categorizeExpenses } = require('../services/aiCategorizer');

const router = express.Router();

// Multer: store uploaded file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// POST /api/expenses/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Parse CSV
    const parsed = parseCSV(req.file.buffer);
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no valid rows' });
    }

    // 2. Categorize with AI (batched, single API call)
    const categorized = await categorizeExpenses(parsed);

    // 3. Bulk insert with shared uploadBatch UUID
    const batchId = uuidv4();
    const docs = categorized.map((exp) => ({ ...exp, uploadBatch: batchId }));
    const saved = await Expense.insertMany(docs);

    res.status(201).json({ uploadBatch: batchId, count: saved.length, expenses: saved });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const { category, batch, sortBy = 'date', order = 'desc' } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (batch) filter.uploadBatch = batch;

    const sortOrder = order === 'asc' ? 1 : -1;
    const expenses = await Expense.find(filter).sort({ [sortBy]: sortOrder });
    res.json(expenses);
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expenses/categories  — must be before /:id
router.get('/categories', async (req, res) => {
  try {
    const { batch } = req.query;
    const match = batch ? { uploadBatch: batch } : {};

    const summary = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

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

// GET /api/expenses/batches — list all upload batches, oldest-first
router.get('/batches', async (req, res) => {
  try {
    const batches = await Expense.aggregate([
      {
        $group: {
          _id: '$uploadBatch',
          date: { $first: '$date' },
          count: { $sum: 1 },
          createdAt: { $min: '$createdAt' },
        },
      },
      { $sort: { createdAt: 1 } },
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

// PATCH /api/expenses/:id — update category
router.patch('/:id', async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: { category } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
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

module.exports = router;
