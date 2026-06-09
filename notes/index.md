# index.js (server) Notes

_Last updated: 2026-05-12_

## File Overview
`server/index.js` — The entry point for the back-end (Node.js) server.

Think of this file as the "front door" of your server. It sets everything up: security, database connection, and URL routes.

## Key Libraries

| Library | Purpose |
|---|---|
| `dotenv` | Loads environment variables from the `.env` file into `process.env`. Keeps secrets (API keys, passwords) out of source code. |
| `express` | The most popular framework for building web servers in Node.js. Lets you define what happens when someone visits a URL. |
| `mongoose` | Makes it easy to read/write data in MongoDB. MongoDB stores data as flexible JSON-like documents instead of tables. |
| `cors` | CORS (Cross-Origin Resource Sharing) is a browser security rule. Without this middleware, the React front-end (port 5173) would be blocked from talking to this server (port 5000). |
| `firebase-admin` | Firebase Admin SDK lets the server verify that a user is actually signed in (checks their ID token on every protected request). |

## Firebase Admin Initialization
Gives the server the ability to verify Firebase ID tokens. Credentials come from environment variables so they stay secret. Firebase stores the private key with literal `\n` characters; `.replace(/\\n/g, '\n')` converts them into real newlines so the key is valid.

## Global Middleware
Middleware = functions that run on EVERY incoming request before your route handlers run. Think of them as checkpoints.

- **CORS** — uses a function-based origin check instead of a single string. Allowed origins:
  - `https://www.simplebizbooks.app` (production)
  - `https://simplebizbooks.app` (production without www)
  - Any `https://*.vercel.app` URL (tested via regex — covers Vercel preview deployments)
  - `http://localhost:5173` (local dev)
  - Requests with no `Origin` header (e.g. server-to-server calls) are allowed through.
  - `credentials: true` is required because the front-end sends `Authorization` headers.
- **COOP header** — sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` on every response. Required for Google sign-in popups to work correctly in the browser after a cross-origin navigation.
- `express.json()` — automatically parses JSON request bodies. Without this, `req.body` would be `undefined` when the client sends JSON.

## Routes
- `app.use('/api/expenses', verifyToken, expenseRoutes)` — all URLs that start with `/api/expenses` are handled by `expenseRoutes`. The `verifyToken` middleware runs first — if the user isn't logged in, the request is rejected before reaching the route handler.
- `GET /api/health` — a simple health-check endpoint. Confirms the server is alive without needing to log in.

## Database Connection + Server Start
Connects to MongoDB first, and only starts listening for requests once the database is ready. If the connection fails, exits immediately rather than running a broken server (`process.exit(1)` stops the Node process with an error code). `app.listen()` tells the server to start accepting connections on `PORT`.
