import dotenv from 'dotenv';

dotenv.config();

// Publisher credentials
const AWIN_PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID || '2782536';
const AWIN_API_TOKEN = process.env.AWIN_API_TOKEN || '';
const CJ_PID = process.env.CJ_PID || '101878348'; // Nudge property (CID 7338898)
const DEFAULT_CASHBACK_RATE = parseFloat(process.env.DEFAULT_CASHBACK_RATE || '3.50');

// CJ tracking domains (rotated randomly)
const CJ_TRACKING_DOMAINS = [
  'www.kqzyfj.com',
  'www.tkqlhyc.com',
  'www.anrdoezrs.net',
  'www.dpbolvw.net',
  'www.jdoqocy.com',
];

/**
 * In-memory cache of merchant mapping
 * Populated by syncAwinProgrammes() — maps domain → { network, merchantId, rate }
 * Refreshed every hour or on demand
 */
let merchantMap = {};
let lastSyncTime = null;
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch joined programmes from Awin API and build merchant mapping
 * Uses validDomains from each programme to map domains → advertiserId
 */
export async function syncAwinProgrammes() {
  if (!AWIN_API_TOKEN || !AWIN_PUBLISHER_ID) {
    console.log('[Affiliate] Awin API token not configured — skipping sync');
    return;
  }

  try {
    console.log('[Affiliate] Syncing Awin joined programmes...');
    const url = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/programmes?relationship=joined`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AWIN_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Awin API returned ${response.status}: ${response.statusText}`);
    }

    const programmes = await response.json();
    console.log(`[Affiliate] Found ${programmes.length} joined Awin programmes`);

    const newMap = {};

    for (const programme of programmes) {
      const advertiserId = programme.id;
      const name = programme.name;
      const displayUrl = programme.displayUrl || '';
      const validDomains = programme.validDomains || [];
      const deeplinkEnabled = programme.deeplinkEnabled !== false;

      // Extract domain from displayUrl
      let primaryDomain = '';
      if (displayUrl) {
        try {
          primaryDomain = new URL(displayUrl).hostname.replace('www.', '');
        } catch {}
      }

      // Add all valid domains to the mapping
      const allDomains = new Set(validDomains);
      if (primaryDomain) allDomains.add(primaryDomain);

      for (const domain of allDomains) {
        if (!domain) continue;
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
        if (!cleanDomain) continue;

        newMap[cleanDomain] = {
          network: 'awin',
          merchantId: String(advertiserId),
          merchantName: name,
          deeplinkEnabled,
          rate: DEFAULT_CASHBACK_RATE, // Default rate; can be overridden per-merchant
        };
      }
    }

    // Merge with any existing CJ entries (preserve CJ merchants)
    for (const [domain, entry] of Object.entries(merchantMap)) {
      if (entry.network === 'cj' && !newMap[domain]) {
        newMap[domain] = entry;
      }
    }

    merchantMap = newMap;
    lastSyncTime = Date.now();
    console.log(`[Affiliate] Merchant mapping built: ${Object.keys(merchantMap).length} domains`);
  } catch (err) {
    console.error('[Affiliate] Error syncing Awin programmes:', err.message);
    // Keep existing mapping on error
  }
}

/**
 * Ensure the merchant map is fresh — sync if stale or empty
 */
async function ensureMerchantMapFresh() {
  if (!lastSyncTime || Date.now() - lastSyncTime > SYNC_INTERVAL_MS) {
    await syncAwinProgrammes();
  }
}

/**
 * Add a CJ merchant to the mapping manually
 * Call this when you join a CJ advertiser program
 */
export function addCjMerchant(domain, advertiserId, rate) {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
  merchantMap[cleanDomain] = {
    network: 'cj',
    merchantId: String(advertiserId),
    rate: rate || DEFAULT_CASHBACK_RATE,
  };
  console.log(`[Affiliate] Added CJ merchant: ${cleanDomain} → AID ${advertiserId}`);
}

/**
 * Manually add an Awin merchant (for cases where API sync misses one)
 */
export function addAwinMerchant(domain, awinmid, rate) {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
  merchantMap[cleanDomain] = {
    network: 'awin',
    merchantId: String(awinmid),
    rate: rate || DEFAULT_CASHBACK_RATE,
  };
  console.log(`[Affiliate] Added Awin merchant: ${cleanDomain} → awinmid ${awinmid}`);
}

function getCjTrackingDomain() {
  return CJ_TRACKING_DOMAINS[Math.floor(Math.random() * CJ_TRACKING_DOMAINS.length)];
}

/**
 * Wrap a URL with the appropriate affiliate network tracking
 * Checks the merchant map (auto-synced from Awin API) for matching domain
 */
export async function wrapWithAffiliate(url, query = '') {
  if (!url) return { url, affiliateUrl: url, cashbackRate: 0, network: null, merchant: null, isAffiliateEligible: false };

  await ensureMerchantMapFresh();

  const domain = extractDomain(url);
  const merchantEntry = findMerchantEntry(domain);

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
    // Awin deep link format — construct directly (no API call needed)
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
    merchantName: merchantEntry.merchantName,
    isAffiliateEligible: true,
  };
}

/**
 * Find merchant entry by domain — checks exact match first, then partial
 */
function findMerchantEntry(domain) {
  if (!domain) return null;
  
  if (merchantMap[domain]) return merchantMap[domain];
  
  for (const [mappedDomain, entry] of Object.entries(merchantMap)) {
    if (domain.includes(mappedDomain) || mappedDomain.includes(domain)) return entry;
  }
  
  return null;
}

/**
 * Get the display cashback rate for a merchant domain
 */
export function getCashbackRate(domain) {
  if (!domain) return DEFAULT_CASHBACK_RATE;
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
  return Object.entries(merchantMap).map(([domain, entry]) => ({
    domain,
    network: entry.network,
    merchantName: entry.merchantName || domain,
    rate: entry.rate || DEFAULT_CASHBACK_RATE,
  }));
}

/**
 * Get sync status info
 */
export function getSyncStatus() {
  return {
    merchantCount: Object.keys(merchantMap).length,
    lastSync: lastSyncTime ? new Date(lastSyncTime).toISOString() : null,
    nextSync: lastSyncTime ? new Date(lastSyncTime + SYNC_INTERVAL_MS).toISOString() : null,
    awinConfigured: !!(AWIN_API_TOKEN && AWIN_PUBLISHER_ID),
    cjConfigured: !!CJ_PID,
  };
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
};
