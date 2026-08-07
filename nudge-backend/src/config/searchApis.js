import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_KEY;
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX;

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function categorizeByDomain(result) {
  const domain = result.sourceDomain || extractDomain(result.url);
  const videoDomains = ['youtube.com', 'vimeo.com', 'dailymotion.com', 'twitch.tv', 'ted.com'];
  const newsDomains = ['reuters.com', 'bbc.com', 'cnn.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com', 'apnews.com', 'npr.org', 'bloomberg.com', 'wsj.com', 'foxnews.com', 'cnbc.com', 'techcrunch.com', 'theverge.com', 'wired.com', 'forbes.com', 'aljazeera.com', 'economist.com', 'ft.com', 'news.google.com', 'arstechnica.com', 'engadget.com', 'theverge.com'];
  const shoppingDomains = ['amazon.com', 'ebay.com', 'etsy.com', 'walmart.com', 'target.com', 'bestbuy.com', 'aliexpress.com', 'alibaba.com', 'shopify.com'];
  if (videoDomains.some(d => domain.includes(d))) return 'videos';
  if (newsDomains.some(d => domain.includes(d))) return 'news';
  if (shoppingDomains.some(d => domain.includes(d))) return 'shopping';
  return 'all';
}

// === SuperNudge ===
export function enhanceQuery(query, keywords) {
  if (!keywords || keywords.length === 0) return query;
  let enhanced = query;
  const lowerQuery = query.toLowerCase();
  for (const kw of keywords) {
    const cleanKw = kw.trim();
    if (!cleanKw || lowerQuery.includes(cleanKw.toLowerCase())) continue; // Skip duplicates
    if (/^\d{4}$/.test(cleanKw)) enhanced += ` ${cleanKw}`;
    else if (/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(cleanKw)) enhanced += ` site:${cleanKw}`;
    else if (cleanKw.includes(' ')) enhanced += ` "${cleanKw}"`;
    else enhanced += ` ${cleanKw}`;
  }
  return enhanced;
}

// === SerpAPI: Regular search (organic + news + shopping) ===
export async function searchSerpAPI(query, num = 50) {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: { q: query, api_key: SERPAPI_KEY, engine: 'google', num },
      timeout: 10000,
    });
    const data = response.data;
    const organic = (data.organic_results || []).map((result, i) => ({
      title: result.title, url: result.link, snippet: result.snippet || '',
      source: 'Google', sourceDomain: extractDomain(result.link),
      relevanceScore: result.position ? (10 - result.position) / 10 : (10 - i) / 10,
      date: result.date || null, type: 'organic', thumbnail: result.thumbnail || '',
    }));
    const news = (data.news_results || []).map((result, i) => ({
      title: result.title, url: result.link, snippet: result.snippet || '',
      source: result.source || 'Google News', sourceDomain: extractDomain(result.link),
      relevanceScore: (10 - i) / 10, date: result.date || null, type: 'news', thumbnail: result.thumbnail || '',
    }));
    const shopping = (data.shopping_results || []).map((result, i) => ({
      title: result.title, url: result.link || '', snippet: result.price || result.description || '',
      source: 'Google Shopping', sourceDomain: extractDomain(result.link || ''),
      relevanceScore: (10 - i) / 10, date: null, type: 'shopping', thumbnail: result.thumbnail || '', price: result.price || '',
    }));
    return { organic, news, shopping };
  } catch (error) {
    console.error('SerpAPI error:', error.message);
    return { organic: [], news: [], shopping: [] };
  }
}

// === SerpAPI: Images ===
export async function searchSerpAPIImages(query, num = 10) {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: { q: query, api_key: SERPAPI_KEY, engine: 'google', tbm: 'isch', num },
      timeout: 10000,
    });
    return (response.data.images_results || []).slice(0, num).map((result, i) => ({
      title: result.title || 'Image Result', url: result.original || result.link || '',
      snippet: result.source || '', source: 'Google Images',
      sourceDomain: extractDomain(result.original || result.link || ''),
      relevanceScore: (10 - i) / 10, date: null, type: 'image', thumbnail: result.thumbnail || '',
    }));
  } catch (error) {
    console.error('SerpAPI Images error:', error.message);
    return [];
  }
}

// === SerpAPI: Videos (dedicated call for YouTube, Vimeo, etc.) ===
export async function searchSerpAPIVideos(query, num = 25) {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: { q: query, api_key: SERPAPI_KEY, engine: 'google', tbm: 'vid', num },
      timeout: 10000,
    });
    return (response.data.video_results || []).slice(0, num).map((result, i) => ({
      title: result.title, url: result.link, snippet: result.snippet || '',
      source: result.source || 'Google Videos', sourceDomain: extractDomain(result.link),
      relevanceScore: (10 - i) / 10, date: result.date || null, type: 'video',
      thumbnail: result.thumbnail || '', duration: result.duration || '',
    }));
  } catch (error) {
    console.error('SerpAPI Videos error:', error.message);
    return [];
  }
}

// === DuckDuckGo (free, no key) ===
export async function searchDuckDuckGo(query, maxResults = 50) {
  try {
    const response = await axios.post('https://html.duckduckgo.com/html/',
      new URLSearchParams({ q: query, b: '', kl: 'us-en' }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://html.duckduckgo.com',
          'Referer': 'https://html.duckduckgo.com/',
        },
        timeout: 10000,
      }
    );
    const results = parseDDGHtml(response.data, maxResults);
    if (results.length > 0) return results;
  } catch (error) {
    console.error('DDG POST error:', error.message);
  }
  try {
    const response = await axios.get('https://lite.duckduckgo.com/lite/', {
      params: { q: query, kl: 'us-en' },
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000,
    });
    return parseDDGLite(response.data, maxResults);
  } catch (error) {
    console.error('DDG Lite error:', error.message);
    return [];
  }
}

function parseDDGHtml(html, maxResults) {
  const $ = cheerio.load(html);
  const results = [];
  $('.result').each((i, elem) => {
    if (i >= maxResults) return false;
    const title = $(elem).find('.result__a').text().trim();
    const rawUrl = $(elem).find('.result__a').attr('href');
    const snippet = $(elem).find('.result__snippet').text().trim();
    if (title && rawUrl) {
      let cleanUrl = rawUrl;
      if (rawUrl.includes('uddg=')) {
        const match = rawUrl.match(/uddg=([^&]+)/);
        if (match) cleanUrl = decodeURIComponent(match[1]);
      }
      results.push({
        title, url: cleanUrl, snippet, source: 'DuckDuckGo',
        sourceDomain: extractDomain(cleanUrl), relevanceScore: (maxResults - i) / maxResults,
        date: null, type: 'organic', thumbnail: '',
      });
    }
  });
  return results;
}

function parseDDGLite(html, maxResults) {
  const $ = cheerio.load(html);
  const results = [];
  $('a[href*="uddg="]').each((i, elem) => {
    if (i >= maxResults) return false;
    const title = $(elem).text().trim();
    const rawUrl = $(elem).attr('href');
    if (title && rawUrl) {
      const match = rawUrl.match(/uddg=([^&]+)/);
      if (match) {
        const cleanUrl = decodeURIComponent(match[1]);
        results.push({
          title, url: cleanUrl, snippet: '', source: 'DuckDuckGo',
          sourceDomain: extractDomain(cleanUrl), relevanceScore: (maxResults - i) / maxResults,
          date: null, type: 'organic', thumbnail: '',
        });
      }
    }
  });
  return results;
}

// === Searx (free meta-search) ===
const SEARX_INSTANCES = ['https://searx.be', 'https://search.mdosch.de', 'https://searx.tiekoetter.com'];

export async function searchSearx(query, maxResults = 50) {
  for (const instance of SEARX_INSTANCES) {
    try {
      const response = await axios.get(`${instance}/search`, {
        params: { q: query, format: 'json', categories: 'general' },
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results.slice(0, maxResults).map((result, i) => ({
          title: result.title || 'Untitled', url: result.url,
          snippet: result.content || '', source: 'Searx',
          sourceDomain: extractDomain(result.url),
          relevanceScore: (maxResults - i) / maxResults,
          date: null, type: 'organic', thumbnail: '',
        }));
      }
    } catch (error) {
      console.error(`Searx (${instance}) error:`, error.message);
    }
  }
  return [];
}


// === SerpAPI: Dedicated Google News search (always returns news for any query) ===
export async function searchSerpAPINews(query, num = 15) {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: { q: query, api_key: SERPAPI_KEY, engine: 'google_news', num, gl: 'us', hl: 'en' },
      timeout: 10000,
    });
    const stories = response.data.news_results || [];
    return stories.slice(0, num).map((result, i) => ({
      title: result.title || 'Untitled',
      url: result.link || '',
      snippet: result.snippet || '',
      source: result.source || (result.source_id || 'Google News'),
      sourceDomain: extractDomain(result.link || ''),
      relevanceScore: (10 - i) / 10,
      date: result.date || result.publish_date || null,
      type: 'news',
      thumbnail: result.thumbnail || '',
    }));
  } catch (error) {
    console.error('SerpAPI News error:', error.message);
    return [];
  }
}

// === Free Google News RSS fallback (no API key needed) ===
export async function searchGoogleNewsRSS(query, maxResults = 15) {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await axios.get(rssUrl, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const $ = cheerio.load(response.data, { xmlMode: true });
    const results = [];
    $('item').each((i, elem) => {
      if (i >= maxResults) return false;
      const title = $(elem).find('title').text().trim();
      const link = $(elem).find('link').text().trim();
      const pubDate = $(elem).find('pubDate').text().trim();
      const source = $(elem).find('source').text().trim();
      const description = $(elem).find('description').text().trim();
      // Extract actual URL from Google News redirect
      let cleanUrl = link;
      if (link.includes('news.google.com/rss/articles/')) {
        // Keep Google News link — it redirects to the actual article
        cleanUrl = link;
      }
      // Parse snippet from description (strip HTML)
      const snippetText = description.replace(/<[^>]+>/g, '').trim().slice(0, 200);
      if (title) {
        results.push({
          title: title.split(' - ').length > 1 && source ? title.split(' - ').slice(0, -1).join(' - ') : title,
          url: cleanUrl,
          snippet: snippetText || '',
          source: source || 'Google News',
          sourceDomain: source ? source.toLowerCase().replace(/\s+/g, '') : extractDomain(cleanUrl),
          relevanceScore: (maxResults - i) / maxResults,
          date: pubDate || null,
          type: 'news',
          thumbnail: '',
        });
      }
    });
    return results;
  } catch (error) {
    console.error('Google News RSS error:', error.message);
    return [];
  }
}

// === Demo Mode ===
function getDemoResults(query) {
  const cats = {
    all: ['Complete Guide', 'Tutorial', 'Best Practices', 'Deep Dive', 'Getting Started', 'FAQ', 'Examples', 'Reference', 'Overview', 'Explained'],
    images: ['Photo Gallery', 'Image Collection', 'Visual Guide', 'Diagram', 'Infographic', 'Chart', 'Illustration', 'Map', 'Screenshot', 'Art'],
    videos: ['Video Tutorial', 'Documentary', 'Walkthrough', 'Demo Video', 'Explainer', 'Interview', 'Presentation', 'Webinar', 'Animation', 'Review'],
    news: ['Latest News', 'Breaking Update', 'Industry Report', 'Analysis', 'Opinion Piece', 'Feature Story', 'Update', 'Announcement', 'Coverage', 'Briefing'],
    shopping: ['Best Deals', 'Top Products', 'Buy Now', 'Price Comparison', 'Top Rated Review', 'Best Seller', 'Recommended', 'Discount Offer', 'New Arrival', 'Editor Pick'],
  };
  const domains = {
    all: ['wikipedia.org', 'medium.com', 'github.com', 'stackoverflow.com', 'reddit.com', 'dev.to', 'hubspot.com', 'arxiv.org', 'news.ycombinator.com', 'developer.mozilla.org'],
    images: ['images.google.com', 'flickr.com', 'unsplash.com', 'pinterest.com', 'imgur.com', 'shutterstock.com', 'gettyimages.com', 'alamy.com', 'pixabay.com', 'stock.adobe.com'],
    videos: ['youtube.com', 'vimeo.com', 'dailymotion.com', 'twitch.tv', 'ted.com', 'coursera.org', 'udemy.com', 'pluralsight.com', 'lynda.com', 'skillshare.com'],
    news: ['reuters.com', 'bbc.com', 'cnn.com', 'nytimes.com', 'theguardian.com', 'apnews.com', 'npr.org', 'bloomberg.com', 'wsj.com', 'techcrunch.com'],
    shopping: ['amazon.com', 'ebay.com', 'etsy.com', 'walmart.com', 'target.com', 'bestbuy.com', 'aliexpress.com', 'alibaba.com', 'shopify.com', 'wish.com'],
  };
  const result = {};
  for (const [cat, suffixes] of Object.entries(cats)) {
    result[cat] = suffixes.map((suffix, i) => ({
      title: `${query} - ${suffix}`,
      url: `https://${domains[cat][i % domains[cat].length]}/search?q=${encodeURIComponent(query)}`,
      snippet: `Discover everything about ${query}. This result covers key aspects including fundamentals, advanced topics, and practical examples.`,
      source: `Demo (${domains[cat][i % domains[cat].length]})`,
      sourceDomain: domains[cat][i % domains[cat].length],
      relevanceScore: (10 - i) / 10,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      type: cat === 'all' ? 'organic' : cat.slice(0, -1),
      thumbnail: '',
    }));
  }
  return result;
}

// === Main fetch ===
export async function fetchSearchResults(query, options = {}) {
  const resultCounts = options.resultCounts || { all: 50, images: 10, videos: 25, news: 15, shopping: 15 };
  const categorized = { all: [], images: [], videos: [], news: [], shopping: [] };

  if (SERPAPI_KEY) {
    // Run ALL SerpAPI calls in parallel — reduces latency from ~24s to ~8s
    console.log('Searching with SerpAPI (parallel)...');
    const [serpRes, imagesRes, videosRes, newsRes] = await Promise.allSettled([
      searchSerpAPI(query, resultCounts.all),
      searchSerpAPIImages(query, resultCounts.images),
      searchSerpAPIVideos(query, resultCounts.videos),
      searchSerpAPINews(query, resultCounts.news),
    ]);

    const serpResults = serpRes.status === 'fulfilled' ? serpRes.value : { organic: [], news: [], shopping: [] };
    categorized.all = serpResults.organic.slice(0, resultCounts.all);
    // Use dedicated Google News results first, then inline news_results, then domain-based fallback
    const dedicatedNews = newsRes.status === 'fulfilled' ? newsRes.value : [];
    categorized.news = [...dedicatedNews, ...serpResults.news].slice(0, resultCounts.news);
    categorized.shopping = serpResults.shopping.slice(0, resultCounts.shopping);
    categorized.images = imagesRes.status === 'fulfilled' ? imagesRes.value : [];
    categorized.videos = videosRes.status === 'fulfilled' ? videosRes.value : [];

    // Domain-based fallback ONLY for categories with very few results (don't duplicate)
    if (categorized.news.length < 5) {
      // Try free Google News RSS as a fallback
      const rssNews = await searchGoogleNewsRSS(query, resultCounts.news);
      const existingUrls = new Set(categorized.news.map(r => r.url));
      const freshRss = rssNews.filter(r => !existingUrls.has(r.url));
      categorized.news = [...categorized.news, ...freshRss].slice(0, resultCounts.news);
      existingUrls.clear();
      const extra = categorized.all.filter(r => categorizeByDomain(r) === 'news' && !existingUrls.has(r.url));
      categorized.news = [...categorized.news, ...extra].slice(0, resultCounts.news);
    }
    if (categorized.shopping.length < 3) {
      const existingUrls = new Set(categorized.shopping.map(r => r.url));
      const extra = categorized.all.filter(r => categorizeByDomain(r) === 'shopping' && !existingUrls.has(r.url));
      categorized.shopping = [...categorized.shopping, ...extra].slice(0, resultCounts.shopping);
    }
    if (categorized.videos.length < 3) {
      const existingUrls = new Set(categorized.videos.map(r => r.url));
      const extra = categorized.all.filter(r => categorizeByDomain(r) === 'videos' && !existingUrls.has(r.url));
      categorized.videos = [...categorized.videos, ...extra].slice(0, resultCounts.videos);
    }
  } else {
    // FREE path: DuckDuckGo + Searx
    console.log('Searching with DuckDuckGo...');
    let organicResults = await searchDuckDuckGo(query, resultCounts.all);
    if (organicResults.length < 5) {
      console.log('DDG returned few results, trying Searx...');
      const searxResults = await searchSearx(query, resultCounts.all);
      // Deduplicate by URL
      const seen = new Set(organicResults.map(r => r.url));
      organicResults = [...organicResults, ...searxResults.filter(r => !seen.has(r.url))];
    }
    categorized.all = organicResults.slice(0, resultCounts.all);
    // For free path, categorize by domain (no duplication)
    categorized.videos = organicResults.filter(r => categorizeByDomain(r) === 'videos').slice(0, resultCounts.videos);
    // For free path: domain-based categorization + free Google News RSS
    const freeRssNews = await searchGoogleNewsRSS(query, resultCounts.news);
    categorized.news = [...freeRssNews, ...organicResults.filter(r => categorizeByDomain(r) === 'news')].slice(0, resultCounts.news);
    categorized.shopping = organicResults.filter(r => categorizeByDomain(r) === 'shopping').slice(0, resultCounts.shopping);
  }

  // Demo mode if nothing came back at all
  if (categorized.all.length === 0) {
    console.warn('No API results, using demo mode.');
    return getDemoResults(query);
  }

  // DON'T fill empty reels — let them show "No results" (transparent, no duplication)
  return categorized;
}

export function checkWinningCombination(reels) {
  if (!reels) return false;
  const topResults = [];
  for (const key of ['all', 'images', 'videos', 'news', 'shopping']) {
    if (reels[key] && reels[key][0]) topResults.push(reels[key][0]);
  }
  if (topResults.length < 3) return false;
  const domains = topResults.map(r => r.sourceDomain);
  const allSameDomain = domains.every(d => d === domains[0]);
  const allHighRelevance = topResults.every(r => r.relevanceScore > 0.6);
  return allSameDomain || allHighRelevance;
}

export function calculateRelevanceScore(results) {
  if (!results || !results.all || results.all.length < 3) return 'medium';
  const topThree = results.all.slice(0, 3);
  const avg = topThree.reduce((sum, r) => sum + r.relevanceScore, 0) / 3;
  return avg > 0.6 ? 'high' : 'medium';
}
