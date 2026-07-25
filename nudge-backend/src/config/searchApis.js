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

export async function searchSerpAPI(query) {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: { q: query, api_key: SERPAPI_KEY, engine: 'google' },
      timeout: 10000,
    });
    return response.data.organic_results?.map((result, i) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet || '',
      source: 'Google (SerpAPI)',
      sourceDomain: extractDomain(result.link),
      relevanceScore: result.position ? (10 - result.position) / 10 : (10 - i) / 10,
      date: result.date || null,
    })) || [];
  } catch (error) {
    console.error('SerpAPI error:', error.message);
    return [];
  }
}

export async function searchGoogleCSE(query) {
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: { q: query, key: GOOGLE_CSE_KEY, cx: GOOGLE_CSE_CX, num: 10 },
      timeout: 10000,
    });
    return response.data.items?.map((item, i) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet || '',
      source: 'Google Custom Search',
      sourceDomain: extractDomain(item.link),
      relevanceScore: (10 - i) / 10,
      date: null,
    })) || [];
  } catch (error) {
    console.error('Google CSE error:', error.message);
    return [];
  }
}

export async function searchDuckDuckGo(query) {
  try {
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);
    const results = [];
    $('.result').each((i, elem) => {
      if (i >= 10) return false;
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
          title, url: cleanUrl, snippet,
          source: 'DuckDuckGo',
          sourceDomain: extractDomain(cleanUrl),
          relevanceScore: (10 - i) / 10, date: null,
        });
      }
    });
    return results;
  } catch (error) {
    console.error('DuckDuckGo error:', error.message);
    return [];
  }
}

function getDemoResults(query) {
  const sources = ['Wikipedia', 'Medium', 'GitHub', 'Stack Overflow', 'Reddit', 'Dev.to', 'YouTube', 'ArXiv', 'Hacker News', 'Mozilla Docs'];
  const domains = ['wikipedia.org', 'medium.com', 'github.com', 'stackoverflow.com', 'reddit.com', 'dev.to', 'youtube.com', 'arxiv.org', 'news.ycombinator.com', 'developer.mozilla.org'];
  const suffixes = ['Complete Guide', 'Tutorial', 'Best Practices', 'Deep Dive', 'Getting Started', 'FAQ', 'Examples', 'Reference', 'Overview', 'Explained'];
  return Array.from({ length: 10 }, (_, i) => ({
    title: `${query} - ${suffixes[i]}`,
    url: `https://${domains[i]}/search?q=${encodeURIComponent(query)}`,
    snippet: `Discover everything about ${query}. This result is from ${sources[i]} and covers key aspects including fundamentals, advanced topics, and practical examples.`,
    source: `Demo (${sources[i]})`,
    sourceDomain: domains[i],
    relevanceScore: (10 - i) / 10,
    date: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}

export async function fetchSearchResults(query) {
  let results = [];
  if (SERPAPI_KEY) {
    console.log('Searching with SerpAPI...');
    results = await searchSerpAPI(query);
  }
  if (results.length < 5 && GOOGLE_CSE_KEY && GOOGLE_CSE_CX) {
    console.log('Searching with Google CSE...');
    results = [...results, ...await searchGoogleCSE(query)];
  }
  if (results.length < 5) {
    console.log('Searching with DuckDuckGo...');
    results = [...results, ...await searchDuckDuckGo(query)];
  }
  if (results.length === 0) {
    console.warn('No API results available, using demo mode.');
    results = getDemoResults(query);
  }
  const seen = new Set();
  results = results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  return results.slice(0, 15);
}

export function calculateRelevanceScore(results) {
  if (!results || results.length < 3) return 'medium';
  const topThree = results.slice(0, 3);
  const avg = topThree.reduce((sum, r) => sum + r.relevanceScore, 0) / 3;
  return avg > 0.6 ? 'high' : 'medium';
}

export function checkWinningCombination(reels) {
  if (!reels || reels.length < 3) return false;
  const topResults = reels.map(reel => reel[0]).filter(Boolean);
  if (topResults.length < 3) return false;
  const domains = topResults.map(r => r.sourceDomain);
  const allSameDomain = domains.every(d => d === domains[0]);
  const allHighRelevance = topResults.every(r => r.relevanceScore > 0.6);
  return allSameDomain || allHighRelevance;
}
