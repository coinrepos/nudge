import dotenv from 'dotenv';

dotenv.config();

const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || '';
const SKIMLINKS_DOMAIN = process.env.SKIMLINKS_DOMAIN || '';
const DEFAULT_CASHBACK_RATE = parseFloat(process.env.DEFAULT_CASHBACK_RATE || '3.50');

// Known merchant cashback rates (as % of purchase)
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
 * Wrap a URL with affiliate tracking parameters
 */
export function wrapWithAffiliate(url, query = '') {
  if (!url) return { url, affiliateUrl: url, cashbackRate: 0 };

  const domain = extractDomain(url);
  let affiliateUrl = url;

  // Amazon Associates
  if (domain.includes('amazon.') && AMAZON_TAG) {
    const separator = url.includes('?') ? '&' : '?';
    affiliateUrl = `${url}${separator}tag=${AMAZON_TAG}`;
  }
  // Skimlinks (wraps any merchant URL)
  else if (SKIMLINKS_DOMAIN) {
    affiliateUrl = `https://${SKIMLINKS_DOMAIN}?url=${encodeURIComponent(url)}`;
  }
  // Amazon search fallback — if no product URL but we have a query
  else if (domain.includes('amazon.') && AMAZON_TAG && query) {
    affiliateUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
  }

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
 */
export function isAffiliateEligible(url) {
  if (!url) return false;
  const domain = extractDomain(url);
  return Object.keys(MERCHANT_RATES).some(m => domain.includes(m));
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export const AFFILIATE_CONFIG = {
  amazonTag: AMAZON_TAG,
  skimlinksDomain: SKIMLINKS_DOMAIN,
  defaultRate: DEFAULT_CASHBACK_RATE,
  merchantRates: MERCHANT_RATES,
};
