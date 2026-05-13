# AI Expense Tracker — Project Context

## Purpose
A full-stack web app that lets a user upload CSV bank statements,
auto-categorizes each expense via AI (GPT-4o-mini via OpenRouter),
and lets them browse, filter, and manage their spending.

---

## Tech Stack
| Layer      | Technology                          |
|------------|-------------------------------------|
| Front-end  | React (Vite), Axios, CSS modules    |
| Back-end   | Node.js, Express                    |
| Database   | MongoDB via Mongoose                |
| Auth       | Firebase Auth (Google sign-in)      |
| AI         | OpenAI SDK → OpenRouter → GPT-4o-mini |

---

## Architecture
client/ (React SPA on port 5173)
└── App.jsx — root component, all top-level state lives here
└── components/ — one file per UI feature
└── firebase.js — Firebase auth helpers

server/ (Express API on port 5000)
└── index.js — entry point, sets up middleware and routes
└── routes/expenses.js — all /api/expenses/* endpoints
└── middleware/auth.js — Firebase token verification (runs on every route)
└── models/ — Mongoose schemas (Expense, CustomCategory, CategoryRule)
└── services/ — business logic (AI categorizer, CSV parser)

---

## Key Terms / Vocabulary
- **Expense** — one row from a CSV: `{ date, description, amount, category, batchId, userId }`
- **Batch** — a group of expenses uploaded together from a single CSV, identified by a UUID `batchId`
- **Category** — a spending label (e.g. "Food & Dining"). Can be a built-in default or a user-created custom category.
- **Category Rule** — a saved mapping from a description keyword to a category (e.g. "Whole Foods" → "Food & Dining"). Checked *before* calling the AI.
- **AI Categorizer** — `server/services/aiCategorizer.js`; uses an in-memory cache + exact-match rules to minimize API calls
- **verifyToken** — the auth middleware; every server route requires a valid Firebase ID token

---

## Coding Conventions
- Every JSX file and JS file has their own markdown file in the notes folder.  If there are updates to a JSX file or JS file update the respective markdown file in the notes folder 
- State is managed in `App.jsx`; child components receive data as props and call up via callbacks
- Server routes are RESTful; all prefixed with `/api/expenses`
- Secrets live in `.env` at the project root (never committed)
- MongoDB filters always include `userId` to keep data isolated per user