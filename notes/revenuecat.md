# revenuecat.js Notes

## File Overview
`client/src/revenuecat.js` — RevenueCat Web SDK singleton + helpers.

RevenueCat tracks whether a user has an active paid subscription (called an "entitlement"). This file:
1. Configures the RC SDK exactly once per page session (singleton pattern).
2. Exposes helpers to check entitlements and fetch customer info.
3. Re-exports RC error types so other files don't need to import RC directly.

## Constants
- `RC_ENTITLEMENT` — The entitlement identifier as configured in the RevenueCat dashboard. Both the monthly and yearly products grant this same entitlement.

## Module-Level Variables
- `purchasesInstance` — holds the single `Purchases` instance for the session. `null` means the SDK has not yet been configured.
- `configuredUserId` — tracks which user ID we last configured for. If a different user signs in on the same page, we reconfigure.

## Exported Functions

### `configureRevenueCat(appUserId)`
Initializes (or re-uses) the RevenueCat SDK for the given Firebase user ID. Safe to call multiple times — will only call `Purchases.configure()` when needed.

- If already configured for this same user, returns the existing instance.
- `Purchases.configure()` must only be called once per user session — calling it again for the same user throws an error.
- `apiKey` comes from the `VITE_REVENUECAT_API_KEY` environment variable.

### `getCustomerInfo()`
Fetches the latest customer subscription info from RevenueCat. Returns `Promise<CustomerInfo>`.

### `hasPremiumAccess(customerInfo)`
Returns `true` if the customer has an active subscription entitlement. Checks whether `RC_ENTITLEMENT` is a key in `customerInfo.entitlements.active`.

## Re-exports
`Purchases`, `ErrorCode`, and `PurchasesError` are re-exported so components can use them without importing RC directly.
