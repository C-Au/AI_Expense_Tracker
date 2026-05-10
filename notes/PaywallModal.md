# PaywallModal.jsx Notes

## File Overview
`client/src/components/PaywallModal.jsx` — RevenueCat managed paywall.

This component renders RevenueCat's hosted paywall UI inside the app. RC's `presentPaywall()` injects its own managed checkout UI into the target HTML element — no custom paywall HTML is needed.

## Flow
1. Component mounts → `presentPaywall()` is called.
2. RC renders its UI into the container div.
3. User completes (or cancels) the purchase flow.
4. `presentPaywall()` resolves with a `PurchaseResult`.
5. If the entitlement is now active → `onPurchaseComplete()` is called and App.jsx shows the main app.

## Props
- `onPurchaseComplete` — callback fired when the user successfully subscribes.
- `darkMode` — for consistent theming with the rest of the app.

## Refs and State
| | Purpose |
|---|---|
| `containerRef` | Ref to the target `<div>` that RC injects its paywall UI into. |
| `hasLaunched` | Prevents `presentPaywall()` from being called twice in React StrictMode, which mounts → unmounts → re-mounts components in development. |
| `paywallError` | Error message or null if RC fails to load. |
| `retryTrigger` | Incremented each time the user clicks Retry, which causes the `useEffect` to re-run. |

## `useEffect` / `launchPaywall`
- Guard: only launches once per trigger, and only once the container div is in the DOM.
- `presentPaywall()` takes over the target element, renders the full checkout flow (product selection + Stripe payment), and resolves with a `PurchaseResult` when the flow is complete.
- `purchaseResult` is `null` when the user dismisses without purchasing.
- If the subscription is now active, hands control back to App.jsx via `onPurchaseComplete()`.
- If the user closes the paywall (`UserCancelledError`), does nothing.
- On any other error, shows a retry screen.
- `retryTrigger` is listed in the dependency array so the effect re-runs when the user clicks Retry.

## JSX Notes
- When `paywallError` is set, shows a simple retry screen with a Retry button.
- The Retry button resets `hasLaunched.current` to `false` and increments `retryTrigger` to re-run the effect.
- RC injects its entire paywall UI into the `.paywall-container` div. It must be in the DOM and have a defined size before `presentPaywall()` is called — the `useEffect` handles that timing via `containerRef`.
