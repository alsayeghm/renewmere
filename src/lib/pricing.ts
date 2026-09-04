import { BillingType } from "@/lib/modules/types";

/**
 * Placeholder pricing until GoldenPass sets real figures. Flat price per
 * billing type — every obligation of that type shows the same number for now.
 */
export const PLACEHOLDER_PRICE_PENCE: Record<BillingType, number> = {
  one_time: 18000, // £180 one-off
  annual: 15000, // £150/year
  recurring: 3500, // £35/month
};

export const BILLING_LABEL: Record<BillingType, string> = {
  one_time: "one-off",
  annual: "per year",
  recurring: "per month",
};

export function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
