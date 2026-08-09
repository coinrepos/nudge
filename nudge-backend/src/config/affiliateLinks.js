import dotenv from 'dotenv';

dotenv.config();

const SKIMLINKS_PUBLISHER_CODE = process.env.SKIMLINKS_PUBLISHER_CODE || '306889X1795159';
const DEFAULT_CASHBACK_RATE = parseFloat(process.env.DEFAULT_CASHBACK_RATE || '3.50');

// Known merchant cashback rates (as % of purchase)
// All merchants are accessed via Skimlinks — no per-merchant signup needed
const MERCHANT_RATES = {
  'amazon.com': 4.0,
  'amazon.co.uk': 4.0,
  'amazon.ca': 4.0,
  'amazon.de': 3.5,
  'ebay.com': 2.5,
  'etsy.com': 3.0,
  'walmart.com': 2.0,
  'target.com': 2.0,
  'bestbuy.com': 1.5,
  'aliexpress.com': 5.0,
  'alibaba.com': 4.5,
  'booking.com': 3.0,
  'expedia.com': 3.0,
  'hotels.com': 3.0,
};

/**
 * Wrap a URL with Skimlinks affiliate tracking
 * Skimlinks handles all merchants (48,500+) — no per-merchant signup needed
 */
export function wrapWithAffiliate(url, query = '') {
  if (!url) return { url, affiliateUrl: url, cashbackRate: 0 };

  const domain = extractDomain(url);

  // All links go through Skimlinks — they handle Amazon, eBay, and 48k+ other merchants
  const affiliateUrl = `https://go.skimresources.com/?id=${SKIMLINKS_PUBLISHER_CODE}&xs=1&url=${encodeURIComponent(url)}`;

  const cashbackRate = getCashbackRate(domain);

  return { url, affiliateUrl, cashbackRate, merchant: domain };
}

/**
 * Get the cashback rate for a merchant domain
 */
export function getCashbackRate(domain) {
  if (!domain) return DEFAULT_CASHBACK_RATE;

  for (const [merchant, rate] of Object.entries(MERCHANT_RATES)) {
    if (domain.includes(merchant)) return rate;
  }

  return DEFAULT_CASHBACK_RATE;
}

/**
 * Calculate the cashback amount for a purchase
 */
export function calculateCashback(purchaseAmount, rate) {
  return (purchaseAmount * rate) / 100;
}

/**
 * Check if a URL is from a supported affiliate merchant
 * With Skimlinks, all merchant links in their network are eligible
 */
export function isAffiliateEligible(url) {
  if (!url) return false;
  return true; // Skimlinks JS auto-wraps all eligible merchant links
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export const AFFILIATE_CONFIG = {
  skimlinksPublisherCode: SKIMLINKS_PUBLISHER_CODE,
  defaultRate: DEFAULT_CASHBACK_RATE,
  merchantRates: MERCHANT_RATES,
};
