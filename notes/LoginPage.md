# LoginPage.jsx Notes

## File Overview
`client/src/components/LoginPage.jsx` — The sign-in screen.

This component is shown when no user is logged in. It lets users:
1. Sign in with an existing email + password account.
2. Create a new email + password account (Sign up).
3. Reset a forgotten password via email link.
4. Sign in with Google.

After any successful action, Firebase fires an `onAuthStateChanged` event in App.jsx, which updates the user state and hides this page automatically.

## React Concepts Used
- `useState` — stores values that can change (causes a re-render when updated).
- `async/await` — pauses execution until an async operation (sign-in) finishes.

## Props
- `darkMode` — `true`/`false` from App.jsx.

## State
| State | Purpose |
|---|---|
| `email` | Email field value. |
| `password` | Password field value. |
| `confirmPassword` | Confirm password field value (sign-up only). |
| `mode` | `'signin'` shows the sign-in form; `'signup'` shows the create-account form. |
| `forgotMode` | When true, shows the "forgot password" view instead of the main form. |
| `error` | Error message or null. |
| `successMsg` | Success message or null. |
| `loading` | True while an auth operation is in progress. |

## `getFriendlyError(code)`
Translates Firebase error codes into friendly messages a beginner can understand.

| Firebase Code | Friendly Message |
|---|---|
| `auth/invalid-credential`, `auth/wrong-password` | Incorrect email or password. |
| `auth/user-not-found` | No account found with that email. |
| `auth/email-already-in-use` | An account with that email already exists. Sign in instead. |
| `auth/weak-password` | Password must be at least 6 characters. |
| `auth/invalid-email` | Please enter a valid email address. |
| `auth/too-many-requests` | Too many attempts. Please try again later. |
| (default) | Something went wrong. Please try again. |

## Event Handlers

### `handleEmailAuth(e)`
Handles the "Sign In" or "Create Account" button click.
- `e.preventDefault()` — stops the browser from reloading the page on form submit.
- Extra validation for sign-up: both password fields must match.
- On success, `onAuthStateChanged` in App.jsx fires and hides this page.

### `handleForgotPassword(e)`
Handles the "Send Reset Email" button click. Validates that the email field is not empty before calling `resetPassword`.

### `handleGoogleSignIn()`
Handles "Sign in with Google". If the user closes the popup (`auth/popup-closed-by-user`), no error is shown.

### `switchMode()`
Switches between sign-in and sign-up mode and clears all fields/messages. Also resets `forgotMode` to false.

## JSX Notes
- Error and success messages are conditionally rendered above the form.
- The forgot-password view is a separate `<form>` shown when `forgotMode` is true.
- The confirm-password field is only shown during sign-up (`mode === 'signup'`).
- `autoComplete="email"` and `autoComplete="current-password"` / `"new-password"` improve browser autofill behavior.
