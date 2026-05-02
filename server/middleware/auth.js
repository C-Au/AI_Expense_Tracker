// ---------------------------------------------------------------------------
// server/middleware/auth.js  —  Firebase token verification middleware.
//
// "Middleware" is a function that sits between the incoming request and
// your route handler. This one checks that the user is logged in.
//
// How it works:
//   1. The React front-end gets a short-lived "ID token" from Firebase
//      after the user signs in.
//   2. The front-end sends that token in every HTTP request inside an
//      "Authorization" header (like showing your ID badge at a door).
//   3. This middleware reads the header, verifies the token with Firebase,
//      and attaches the decoded user info to req.user.
//   4. If the token is missing or invalid, it returns a 401 Unauthorized
//      response and the route handler never runs.
// ---------------------------------------------------------------------------
const admin = require('firebase-admin');

// Export this function so index.js can use it as middleware.
// "async" means the function can use "await" to pause for async operations.
module.exports = async function verifyToken(req, res, next) {
  // req.headers.authorization is the "Authorization" header sent by the client.
  // It should look like: "Bearer eyJhbGciOi..."
  const authHeader = req.headers.authorization;

  // If the header is missing or doesn't start with "Bearer ", reject the request.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }

  // Extract just the token part (everything after "Bearer ").
  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Ask Firebase to verify the token. If it's valid, we get back a
    // "decoded" object that contains the user's uid, email, etc.
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Attach the user info to the request so route handlers can access it
    // via req.user.uid, req.user.email, etc.
    req.user = decoded;

    // Call next() to pass control to the next middleware or route handler.
    next();
  } catch {
    // If verifyIdToken throws (e.g. token expired or tampered with), reject.
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
};
