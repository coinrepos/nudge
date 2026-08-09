import dotenv from 'dotenv';

dotenv.config();

// Publisher credentials
const AWIN_PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID || '2782536';
const CJ_PID = process.env.CJ_PID || '';
const DEFAULT_CASHBACK_RATE = parseFloat(process.env.DEFAULT_CASHBACK_RATE || '3.50');

// CJ tracking domains (rotated randomly — CJ uses several)
const CJ_TRACKING_DOMAINS = [
  'www.kqzyfj.com',
  'www.tkqlhyc.com',
  'www.anrdoezrs.net',
  'www.dpbolvw.net',
  'www.jdoqocy.com',
];

/**
 * Merchant mapping table
 * Maps merchant domains to their network + merchant IDs
 * 
 * To add a merchant:
 * 1. Join the merchant's program in Awin or CJ dashboard
 * 2. Find the merchant ID (Awin: awinmid in Link Builder; CJ: AID in Advertiser list)
 * 3. Add an entry below with the domain, network, and merchant ID
 */
const MERCHANT_MAP = {
  // === AWIN MERCHANTS ===
  // Format: 'domain': { network: 'awin', merchantId: 'awinmid_value', rate: X.X }
  
  // === CJ MERCHANTS ===
  // Format: 'domain': { network: 'cj', merchantId: 'AID_value', rate: X.X }
};

// Known merchant cashback rates (display purposes — actual rate set per-merchant above)
const DEFAULT_MERCHANT_RATES = {
  'amazon.com': 4.0,
  'amazon.co.uk': 4.0,
  'amazon.ca': 4.0,
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

function getCjTrackingDomain() {
  return CJ_TRACKING_DOMAINS[Math.floor(Math.random() * CJ_TRACKING_DOMAINS.length)];
}

/**
 * Wrap a URL with the appropriate affiliate network tracking
 * Checks Awin first, then CJ, then returns plain URL if no match
 */
export function wrapWithAffiliate(url, query = '') {
  if (!url) return { url, affiliateUrl: url, cashbackRate: 0, network: null, merchant: null };

  const domain = extractDomain(url);
  const merchantEntry = findMerchantEntry(domain);

  // No merchant match — return plain URL (no affiliate tracking)
  if (!merchantEntry) {
    return { 
      url, 
      affiliateUrl: url, 
      cashbackRate: 0, 
      network: null, 
      merchant: domain,
      isAffiliateEligible: false,
    };
  }

  let affiliateUrl = url;

  if (merchantEntry.network === 'awin') {
    // Awin deep link format
    affiliateUrl = `https://www.awin1.com/cread.php?awinmid=${merchantEntry.merchantId}&awinaffid=${AWIN_PUBLISHER_ID}&clickref=nudge&ued=${encodeURIComponent(url)}`;
  } else if (merchantEntry.network === 'cj' && CJ_PID) {
    // CJ deep link format
    const trackingDomain = getCjTrackingDomain();
    affiliateUrl = `https://${trackingDomain}/click-${CJ_PID}-${merchantEntry.merchantId}?url=${encodeURIComponent(url)}`;
  }

  const cashbackRate = merchantEntry.rate || getCashbackRate(domain);

  return { 
    url, 
    affiliateUrl, 
    cashbackRate, 
    network: merchantEntry.network,
    merchant: domain,
    isAffiliateEligible: true,
  };
}

/**
 * Find merchant entry by domain — checks exact match first, then partial
 */
function findMerchantEntry(domain) {
  if (!domain) return null;
  
  // Exact match
  if (MERCHANT_MAP[domain]) return MERCHANT_MAP[domain];
  
  // Partial match (handles subdomains like 'www.amazon.com' matching 'amazon.com')
  for (const [mappedDomain, entry] of Object.entries(MERCHANT_MAP)) {
    if (domain.includes(mappedDomain)) return entry;
  }
  
  return null;
}

/**
 * Get the display cashback rate for a merchant domain
 */
export function getCashbackRate(domain) {
  if (!domain) return DEFAULT_CASHBACK_RATE;

  for (const [merchant, rate] of Object.entries(DEFAULT_MERCHANT_RATES)) {
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
 * Check if a URL is from a joined affiliate merchant
 */
export function isAffiliateEligible(url) {
  if (!url) return false;
  const domain = extractDomain(url);
  return findMerchantEntry(domain) !== null;
}

/**
 * Get list of all configured merchants (for display on Nudge Cash page)
 */
export function getConfiguredMerchants() {
  return Object.entries(MERCHANT_MAP).map(([domain, entry]) => ({
    domain,
    network: entry.network,
    rate: entry.rate || getCashbackRate(domain),
  }));
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export const AFFILIATE_CONFIG = {
  awinPublisherId: AWIN_PUBLISHER_ID,
  cjPid: CJ_PID,
  defaultRate: DEFAULT_CASHBACK_RATE,
  merchantCount: Object.keys(MERCHANT_MAP).length,
};
