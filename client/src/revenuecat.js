// ---------------------------------------------------------------------------
// client/src/revenuecat.js  —  RevenueCat Web SDK singleton + helpers.
//
// RevenueCat tracks whether a user has an active paid subscription
// (called an "entitlement"). This file:
//   1. Configures the RC SDK exactly once per page session (singleton pattern).
//   2. Exposes helpers to check entitlements and fetch customer info.
//   3. Re-exports RC error types so other files don't need to import RC directly.
// ---------------------------------------------------------------------------
import { Purchases, ErrorCode, PurchasesError } from "@revenuecat/purchases-js";

// The entitlement identifier as configured in the RevenueCat dashboard.
// Both the monthly and yearly products grant this same entitlement.
export const RC_ENTITLEMENT = "AI Expense Tracker App Pro";

// Module-level variable — holds the single Purchases instance for the session.
// null means the SDK has not yet been configured.
let purchasesInstance = null;

// Track which user ID we last configured for.
// If a different user signs in on the same page, we reconfigure.
let configuredUserId = null;

/**
 * Initializes (or re-uses) the RevenueCat SDK for the given Firebase user ID.
 * Safe to call multiple times — will only call Purchases.configure() when needed.
 *
 * @param {string} appUserId - The Firebase UID of the signed-in user.
 * @returns {Purchases} The configured Purchases instance.
 */
export function configureRevenueCat(appUserId) {
  // If already configured for this same user, return the existing instance.
  if (purchasesInstance && configuredUserId === appUserId) {
    return purchasesInstance;
  }

  // Configure the SDK. Purchases.configure() must only be called once per user
  // session — calling it again for the same user throws an error.
  purchasesInstance = Purchases.configure({
    apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
    appUserId,
  });

  configuredUserId = appUserId;
  return purchasesInstance;
}

/**
 * Fetches the latest customer subscription info from RevenueCat.
 *
 * @returns {Promise<CustomerInfo>} The RC CustomerInfo object.
 */
export async function getCustomerInfo() {
  return Purchases.getSharedInstance().getCustomerInfo();
}

/**
 * Returns true if the customer has an active subscription entitlement.
 *
 * @param {CustomerInfo} customerInfo - The CustomerInfo object from RC.
 * @returns {boolean}
 */
export function hasPremiumAccess(customerInfo) {
  return RC_ENTITLEMENT in customerInfo.entitlements.active;
}

// Re-export RC types so components can use them without importing RC directly.
export { Purchases, ErrorCode, PurchasesError };
