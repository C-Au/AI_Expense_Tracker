# Plan: Add Email/Password Auth to Login Page

## Goal
Add email + password sign-in, sign-up, and forgot-password to the existing LoginPage.jsx,
alongside the existing Google sign-in button. No server-side changes needed.

## Phase 1 — Firebase Console (manual, must happen first)
1. Go to Firebase Console → Authentication → Sign-in method → Enable "Email/Password"

## Phase 2 — firebase.js
2. Import signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail from 'firebase/auth'
3. Export them as named functions (same pattern as signInWithGoogle)

## Phase 3 — LoginPage.jsx (main work)
4. Add useState for: email, password, confirmPassword, mode ('signin'|'signup'), forgotMode (bool), successMsg
5. Add handleEmailAuth() — calls signIn or createUser depending on mode, validates passwords match in signup
6. Add handleForgotPassword() — calls sendPasswordResetEmail, shows success message
7. Restructure JSX: email form (inputs + submit btn) → forgot link → divider "or" → Google btn → toggle link
8. Show success message when reset email is sent
9. Show specific error messages (wrong-password, email-in-use, passwords-don't-match, user-not-found)

## Phase 4 — app.css
10. Add .login-input styles (text inputs)
11. Add .email-submit-btn styles (primary submit button)
12. Add .login-divider styles ("— or —" separator)
13. Add .login-link-btn styles (text toggle links)

## Files modified
- client/src/firebase.js
- client/src/components/LoginPage.jsx
- client/src/styles/app.css

## No changes needed
- server/middleware/auth.js — already works with any Firebase token
- App.jsx — onAuthStateChanged already handles email/password users
- .env — no new secrets needed
