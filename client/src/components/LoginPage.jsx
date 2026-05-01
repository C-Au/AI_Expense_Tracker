// ---------------------------------------------------------------------------
// client/src/components/LoginPage.jsx  —  The sign-in screen.
//
// This component is shown when no user is logged in. It presents a
// "Sign in with Google" button that triggers the Firebase popup flow.
//
// React concepts used here:
//   - useState: stores values that can change (like whether loading is happening).
//   - async/await: pauses execution until the sign-in popup resolves.
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { signInWithGoogle } from '../firebase';

// This component receives one prop: darkMode (true/false) from App.jsx.
// Props are like function arguments — they let a parent pass data to a child.
export default function LoginPage({ darkMode }) {
  // useState returns [currentValue, setterFunction].
  // Calling setError('something') will re-render the component with the new value.
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);    // Clear any previous error.
    setLoading(true);  // Show a spinner while the popup is open.
    try {
      await signInWithGoogle(); // Opens the Google popup and waits for the user.
      // If sign-in succeeds, Firebase fires an onAuthStateChanged event in App.jsx,
      // which updates the user state and hides this LoginPage automatically.
    } catch (err) {
      // 'auth/popup-closed-by-user' means the user dismissed the popup on purpose.
      // We don't show an error for that — only for unexpected failures.
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      // finally always runs, even if there was an error.
      setLoading(false);
    }
  };

  return (
    // Template literals (backticks + ${}) let us conditionally add the 'dark' class.
    <div className={`login-page${darkMode ? ' dark' : ''}`}>
      <div className="login-card">
        {/* The app logo SVG */}
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="#4f46e5" />
            <path d="M14 34V16h6l4 12 4-12h6v18h-4V22l-4.5 12h-3L18 22v12h-4z" fill="white" />
          </svg>
        </div>
        <h1 className="login-title">Simple Books</h1>
        <p className="login-subtitle">AI-powered expense tracking</p>

        {/* Only render the error message if there is one (short-circuit rendering). */}
        {error && <div className="login-error">{error}</div>}

        <button
          className="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={loading} // Prevent double-clicking while loading.
        >
          {loading ? (
            // Show a CSS spinner while waiting for the popup.
            <span className="login-spinner" />
          ) : (
            // Otherwise show the Google "G" logo (inline SVG).
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
          )}
          <span>{loading ? 'Signing in…' : 'Sign in with Google'}</span>
        </button>

        <p className="login-footer">
          Your expenses are private and only visible to you.
        </p>
      </div>
    </div>
  );
}
