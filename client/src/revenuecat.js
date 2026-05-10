import { Purchases, ErrorCode, PurchasesError } from "@revenuecat/purchases-js";

export const RC_ENTITLEMENT = "AI Expense Tracker App Pro";

let purchasesInstance = null;

let configuredUserId = null;

export function configureRevenueCat(appUserId) {
  if (purchasesInstance && configuredUserId === appUserId) {
    return purchasesInstance;
  }

  purchasesInstance = Purchases.configure({
    apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
    appUserId,
  });

  configuredUserId = appUserId;
  return purchasesInstance;
}

export async function getCustomerInfo() {
  return Purchases.getSharedInstance().getCustomerInfo();
}

export function hasPremiumAccess(customerInfo) {
  return RC_ENTITLEMENT in customerInfo.entitlements.active;
}

export { Purchases, ErrorCode, PurchasesError };
