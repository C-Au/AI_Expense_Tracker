// ---------------------------------------------------------------------------
// server/index.js  —  The entry point for the back-end (Node.js) server.
//
// Think of this file as the "front door" of your server.
// It sets everything up: security, database connection, and URL routes.
// ---------------------------------------------------------------------------

// Load environment variables from the .env file into process.env.
// This keeps secrets (API keys, passwords) out of your source code.
require('dotenv').config({ path: '../.env' });

// Express is the most popular framework for building web servers in Node.js.
// It lets you define what happens when someone visits a URL.
const express = require('express');

// Mongoose is a library that makes it easy to read/write data in MongoDB.
// MongoDB stores data as flexible JSON-like documents instead of tables.
const mongoose = require('mongoose');

// CORS (Cross-Origin Resource Sharing) is a browser security rule.
// Without this middleware, your React front-end (running on port 5173)
// would be blocked from talking to this server (running on port 5000).
const cors = require('cors');

// Firebase Admin SDK lets the server verify that a user is actually
// signed in (we check their ID token on every protected request).
const admin = require('firebase-admin');

// Import our expense routes and the auth middleware from other files.
const expenseRoutes = require('./routes/expenses');
const verifyToken = require('./middleware/auth');

// ---------------------------------------------------------------------------
// Initialize Firebase Admin SDK
// ---------------------------------------------------------------------------
// This gives our server the ability to verify Firebase ID tokens.
// The credentials come from environment variables so they stay secret.
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Firebase stores the private key with literal "\n" characters;
    // .replace() converts them into real newlines so the key is valid.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

// Create the Express application.
const app = express();

// Use the PORT from .env if provided; otherwise fall back to 5000.
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Global Middleware
// Middleware = functions that run on EVERY incoming request before your
// route handlers run. Think of them as checkpoints.
// ---------------------------------------------------------------------------

// Allow requests from any origin (our React dev server).
app.use(cors({ origin: 'https://ai-expense-tracker-olive.vercel.app' }));

// Automatically parse JSON request bodies.
// Without this, req.body would be undefined when the client sends JSON.
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// All URLs that start with /api/expenses are handled by expenseRoutes.
// The verifyToken middleware runs first — if the user isn't logged in,
// the request is rejected before reaching the route handler.
app.use('/api/expenses', verifyToken, expenseRoutes);

// A simple health-check endpoint. You can visit /api/health in the browser
// to confirm the server is alive without needing to log in.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Database Connection + Server Start
// ---------------------------------------------------------------------------
// We connect to MongoDB first, and only start listening for requests
// once the database is ready. If the connection fails, we exit immediately
// rather than running a broken server.
mongoose
  .connect(process.env.MONGODB_URI, { dbName: 'AI_Exp_Tracker' })
  .then(() => {
    console.log('Connected to MongoDB');
    // app.listen() tells the server to start accepting connections on PORT.
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // process.exit(1) stops the Node process with an error code.
    process.exit(1);
  });
