import { useEffect, useRef, useState } from "react";
import {
  Purchases,
  ErrorCode,
  PurchasesError,
  RC_ENTITLEMENT,
} from "../revenuecat";

export default function PaywallModal({ onPurchaseComplete, darkMode }) {
  const containerRef = useRef(null);

  const hasLaunched = useRef(false);

  const [paywallError, setPaywallError] = useState(null);

  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (hasLaunched.current || !containerRef.current) return;
    hasLaunched.current = true;

    async function launchPaywall() {
      try {
        const purchaseResult =
          await Purchases.getSharedInstance().presentPaywall({
            htmlTarget: containerRef.current,
          });

        if (
          purchaseResult &&
          RC_ENTITLEMENT in purchaseResult.customerInfo.entitlements.active
        ) {
          onPurchaseComplete();
        }
      } catch (err) {
        if (
          err instanceof PurchasesError &&
          err.errorCode === ErrorCode.UserCancelledError
        ) {
        } else {
          console.error("RevenueCat paywall error:", err);
          setPaywallError(
            "Something went wrong loading the paywall. Please try again.",
          );
        }
      }
    }

    launchPaywall();
  }, [retryTrigger]);

  return (
    <div className={`paywall-overlay${darkMode ? " dark" : ""}`}>
      {paywallError ? (
        <div className="paywall-error-box">
          <p className="paywall-error-msg">{paywallError}</p>
          <button
            className="signout-btn"
            onClick={() => {
              hasLaunched.current = false;
              setPaywallError(null);
              setRetryTrigger((n) => n + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="paywall-container" ref={containerRef} />
      )}
    </div>
  );
}
