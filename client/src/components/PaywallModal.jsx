// ---------------------------------------------------------------------------
// client/src/components/PaywallModal.jsx  —  RevenueCat managed paywall.
//
// This component renders RevenueCat's hosted paywall UI inside the app.
// RC's presentPaywall() injects its own managed checkout UI into the target
// HTML element — no custom paywall HTML is needed.
//
// Flow:
//   1. Component mounts → presentPaywall() is called.
//   2. RC renders its UI into the container div.
//   3. User completes (or cancels) the purchase flow.
//   4. presentPaywall() resolves with a PurchaseResult.
//   5. If the entitlement is now active → onPurchaseComplete() is called
//      and App.jsx shows the main app.
//
// Props:
//   onPurchaseComplete — callback fired when the user successfully subscribes.
//   darkMode           — for consistent theming with the rest of the app.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react';
import { Purchases, ErrorCode, PurchasesError, RC_ENTITLEMENT } from '../revenuecat';

export default function PaywallModal({ onPurchaseComplete, darkMode }) {
  const containerRef = useRef(null);

  // Prevents presentPaywall() from being called twice in React StrictMode,
  // which mounts → unmounts → re-mounts components in development.
  const hasLaunched = useRef(false);

  const [paywallError, setPaywallError] = useState(null);

  // Incremented each time the user clicks Retry, which causes the effect to re-run.
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    // Guard: only launch once per trigger, and only once the container div is in the DOM.
    if (hasLaunched.current || !containerRef.current) return;
    hasLaunched.current = true;

    async function launchPaywall() {
      try {
        // presentPaywall() takes over the target element, renders the full
        // checkout flow (product selection + Stripe payment), and resolves
        // with a PurchaseResult when the flow is complete.
        const purchaseResult = await Purchases.getSharedInstance().presentPaywall({
          htmlTarget: containerRef.current,
        });

        // purchaseResult is null when the user dismisses without purchasing.
        if (
          purchaseResult &&
          RC_ENTITLEMENT in purchaseResult.customerInfo.entitlements.active
        ) {
          // Subscription is now active — hand control back to App.jsx.
          onPurchaseComplete();
        }
      } catch (err) {
        if (
          err instanceof PurchasesError &&
          err.errorCode === ErrorCode.UserCancelledError
        ) {
          // User closed the paywall — do nothing.
        } else {
          console.error('RevenueCat paywall error:', err);
          setPaywallError(
            'Something went wrong loading the paywall. Please try again.'
          );
        }
      }
    }

    launchPaywall();
    // retryTrigger causes this effect to re-run when the user clicks Retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryTrigger]);

  return (
    <div className={`paywall-overlay${darkMode ? ' dark' : ''}`}>
      {paywallError ? (
        // Show a simple retry screen if RC fails to load.
        <div className="paywall-error-box">
          <p className="paywall-error-msg">{paywallError}</p>
          <button
            className="signout-btn"
            onClick={() => {
              // Reset the launch guard and bump the trigger so the effect re-runs.
              hasLaunched.current = false;
              setPaywallError(null);
              setRetryTrigger((n) => n + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        // RC injects its entire paywall UI into this element.
        // It must be in the DOM and have a defined size before presentPaywall()
        // is called — the useEffect handles that timing via containerRef.
        <div className="paywall-container" ref={containerRef} />
      )}
    </div>
  );
}
