# firebase.js Notes

## File Overview
`client/src/firebase.js` — Firebase setup and authentication helpers.

Firebase is Google's platform that handles user authentication (login). This file initializes the Firebase connection and exports helper functions that the rest of the app uses to sign in and sign out.

## Config
Firebase needs these config values to know which project to connect to. `import.meta.env` is how Vite (our dev server) reads `.env` variables. Variables must start with `VITE_` to be accessible in the browser.

## Initialization
- `initializeApp(firebaseConfig)` — initializes the Firebase app. This must happen exactly once.
- `getAuth(app)` — returns the authentication service for our Firebase app. Exported so other files (like App.jsx) can listen for auth state changes.

## Google Auth
`GoogleAuthProvider` sets up the "Sign in with Google" flow. `setCustomParameters({ prompt: 'select_account' })` forces the Google account picker to show even if the user is already signed in to one account.

## Exported Functions

| Function | Description |
|---|---|
| `auth` | The Firebase auth service instance. |
| `signInWithGoogle()` | Opens a popup window for Google sign-in. Returns a promise that resolves when the user completes sign-in. |
| `signOutUser()` | Signs the current user out. |
| `signInWithEmail(email, password)` | Signs in an existing user with their email and password. Returns a promise that resolves with the user credential on success. |
| `signUpWithEmail(email, password)` | Creates a brand-new account with email and password. Returns a promise that resolves with the new user credential on success. |
| `resetPassword(email)` | Sends a password-reset email. Firebase emails a link the user can click to choose a new password. |
| `onAuthStateChanged` | Re-exported from `firebase/auth` so App.jsx can import it from here instead of directly from `firebase/auth`. |
