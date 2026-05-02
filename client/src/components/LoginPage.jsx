// ---------------------------------------------------------------------------
// client/src/components/LoginPage.jsx  —  The sign-in screen.
//
// This component is shown when no user is logged in. It lets users:
//   1. Sign in with an existing email + password account.
//   2. Create a new email + password account (Sign up).
//   3. Reset a forgotten password via email link.
//   4. Sign in with Google (unchanged from before).
//
// After any successful action, Firebase fires an onAuthStateChanged event
// in App.jsx, which updates the user state and hides this page automatically.
//
// React concepts used here:
//   - useState: stores values that can change (causes a re-render when updated).
//   - async/await: pauses execution until an async operation (sign-in) finishes.
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '../firebase';

// This component receives one prop: darkMode (true/false) from App.jsx.
export default function LoginPage({ darkMode }) {
  // --- Form field values ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- UI mode ---
  // 'signin' shows the sign-in form; 'signup' shows the create-account form.
  const [mode, setMode] = useState('signin');
  // When true, shows the "forgot password" view instead of the main form.
  const [forgotMode, setForgotMode] = useState(false);

  // --- Feedback ---
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Translates Firebase error codes into friendly messages a beginner can understand.
  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect email or password.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/email-already-in-use':
        return 'An account with that email already exists. Sign in instead.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  // Handles the "Sign In" or "Create Account" button click.
  const handleEmailAuth = async (e) => {
    e.preventDefault(); // Stop the browser from reloading the page on form submit.
    setError(null);
    setSuccessMsg(null);

    // Extra validation for sign-up: both password fields must match.
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      // On success, onAuthStateChanged in App.jsx fires and hides this page.
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Handles the "Send Reset Email" button click.
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError('Please enter your email address above.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Handles "Sign in with Google" button click.
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Switches between sign-in and sign-up mode and clears all fields/messages.
  const switchMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setForgotMode(false);
  };

  return (
    <div className={`login-page${darkMode ? ' dark' : ''}`}>
      <div className="login-card">
        <h1 className="login-title">SimpleBiz Books</h1>
        <p className="login-subtitle">AI-powered expense tracking</p>

        {/* Feedback messages */}
        {error && <div className="login-error">{error}</div>}
        {successMsg && <div className="login-success">{successMsg}</div>}

        {/* ---- Forgot-password view ---- */}
        {forgotMode ? (
          <form onSubmit={handleForgotPassword} style={{ width: '100%' }}>
            <input
              className="login-input"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <button className="email-submit-btn" type="submit" disabled={loading}>
              {loading ? <span className="login-spinner" /> : 'Send Reset Email'}
            </button>
            <button
              type="button"
              className="login-link-btn"
              onClick={() => { setForgotMode(false); setError(null); setSuccessMsg(null); }}
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          /* ---- Main sign-in / sign-up form ---- */
          <form onSubmit={handleEmailAuth} style={{ width: '100%' }}>
            <input
              className="login-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              className="login-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            {/* Confirm-password field is only shown during sign-up */}
            {mode === 'signup' && (
              <input
                className="login-input"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            )}

            <button className="email-submit-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="login-spinner" />
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>

            {/* Forgot password link — only shown in sign-in mode */}
            {mode === 'signin' && (
              <button
                type="button"
                className="login-link-btn"
                onClick={() => { setForgotMode(true); setError(null); setSuccessMsg(null); }}
              >
                Forgot password?
              </button>
            )}
          </form>
        )}

        {/* ---- "or" divider ---- */}
        {!forgotMode && (
          <>
            <div className="login-divider">or</div>

            {/* Google sign-in button (unchanged) */}
            <button
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
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

            {/* Toggle between sign-in and sign-up */}
            <button type="button" className="login-link-btn" onClick={switchMode}>
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </>
        )}

        <p className="login-footer">
          Your expenses are private and only visible to you.
        </p>
      </div>
    </div>
  );
}
