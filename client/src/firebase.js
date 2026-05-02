// ---------------------------------------------------------------------------
// client/src/firebase.js  —  Firebase setup and authentication helpers.
//
// Firebase is Google's platform that handles user authentication (login).
// This file initializes the Firebase connection and exports helper
// functions that the rest of the app uses to sign in and sign out.
// ---------------------------------------------------------------------------
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

// Firebase needs these config values to know which project to connect to.
// import.meta.env is how Vite (our dev server) reads .env variables.
// Variables must start with VITE_ to be accessible in the browser.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize the Firebase app with our config. This must happen once.
const app = initializeApp(firebaseConfig);

// getAuth() returns the authentication service for our Firebase app.
// We export it so other files (like App.jsx) can listen for auth state changes.
export const auth = getAuth(app);

// GoogleAuthProvider sets up the "Sign in with Google" flow.
// setCustomParameters({ prompt: 'select_account' }) forces the Google
// account picker to show even if the user is already signed in to one account.
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Opens a popup window for Google sign-in.
// Returns a promise that resolves when the user completes the sign-in.
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Signs the current user out.
export const signOutUser = () => signOut(auth);

// Signs in an existing user with their email and password.
// Returns a promise that resolves with the user credential on success.
export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// Creates a brand-new account with email and password.
// Returns a promise that resolves with the new user credential on success.
export const signUpWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

// Sends a password-reset email to the given address.
// Firebase emails a link the user can click to choose a new password.
export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email);

// Re-export onAuthStateChanged so App.jsx can import it from here
// instead of directly from 'firebase/auth'.
export { onAuthStateChanged };
