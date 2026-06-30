import Parser from 'rss-parser';
import { Readability } from '@mozilla/readability';
import {
  getStoredFeeds,
  saveStoredFeed,
  deleteStoredFeed,
  clearStoredFeeds,
  getStoredArticles,
  saveStoredArticles,
  getStoredFullArticle,
  saveStoredFullArticle
} from './db';

export interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  contentSnippet: string;
  content: string;
  category: string;
  feedTitle: string;
}

export interface FeedConfig {
  title: string;
  url: string;
  category: string;
}

export interface FullArticle {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string;
}

export const FEEDS: FeedConfig[] = [
  // Artificial Intelligence
  { title: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", category: "Artificial Intelligence" },
  { title: "Google Research Blog", url: "https://blog.research.google/feeds/posts/default", category: "Artificial Intelligence" },
  { title: "ArXiv AI Research", url: "https://rss.arxiv.org/rss/cs.AI", category: "Artificial Intelligence" },
  { title: "Anthropic News", url: "https://www.anthropic.com/news/feed.xml", category: "Artificial Intelligence" },

  // Software Engineering
  { title: "InfoQ Software Dev", url: "https://feed.infoq.com/", category: "Software Engineering" },
  { title: "GitHub Engineering Blog", url: "https://github.blog/feed/", category: "Software Engineering" },
  { title: "AWS Architecture Blog", url: "https://aws.amazon.com/blogs/architecture/feed/", category: "Software Engineering" },

  // Design & Frontend
  { title: "Vercel Blog", url: "https://vercel.com/blog/feed", category: "Design & Frontend" },
  { title: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", category: "Design & Frontend" },
  { title: "CSS-Tricks", url: "https://css-tricks.com/feed/", category: "Design & Frontend" },

  // Tech News & Startups
  { title: "Hacker News", url: "https://news.ycombinator.com/rss", category: "Tech News & Startups" },
  { title: "TechCrunch", url: "https://techcrunch.com/feed/", category: "Tech News & Startups" },
  { title: "Wired", url: "https://www.wired.com/feed/rss", category: "Tech News & Startups" },

  // Science & Research
  { title: "Nature Journal News", url: "https://www.nature.com/nature.rss", category: "Science & Research" },
  { title: "Scientific American", url: "https://www.scientificamerican.com/feed/", category: "Science & Research" },
  { title: "IEEE Spectrum", url: "https://spectrum.ieee.org/feeds/feed.rss", category: "Science & Research" }
];

const parser = new Parser();

function isMainlyEnglish(text: string): boolean {
  if (!text) return true;
  // Calculate the percentage of standard printable ASCII characters
  const asciiCount = (text.match(/[\x00-\x7F]/g) || []).length;
  return (asciiCount / text.length) > 0.85;
}

export async function fetchFeedArticles(feed: FeedConfig): Promise<Article[]> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(feed.url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch feed ${feed.title}: ${response.statusText}`);
  }
  const xmlText = await response.text();
  const parsed = await parser.parseString(xmlText);
  
  const articles = (parsed.items || []).map((item: any) => {
    const id = item.guid || item.link || Math.random().toString(36).substring(2);
    
    // Clean and truncate snippet
    let snippet = item.contentSnippet || item.summary || '';
    if (snippet.length > 250) {
      snippet = snippet.substring(0, 250) + '...';
    }
    // Remove HTML tags from snippet if any
    snippet = snippet.replace(/<[^>]*>/g, '');

    return {
      id,
      title: item.title || 'Untitled Article',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      creator: item.creator || item.author || parsed.title || 'Unknown',
      contentSnippet: snippet,
      content: item.content || item['content:encoded'] || item.summary || '',
      category: feed.category,
      feedTitle: feed.title
    };
  });

  // Filter out any non-English articles
  return articles.filter(art => isMainlyEnglish(art.title) && isMainlyEnglish(art.contentSnippet));
}

export async function fetchAllFeeds(feeds: FeedConfig[], forceRefresh = false): Promise<Article[]> {
  if (!forceRefresh) {
    // Try dynamic IndexedDB cache first
    const cached = await getStoredArticles();
    if (cached && cached.length > 0) {
      return cached;
    }

    // Try static JSON fetch from background action
    try {
      const response = await fetch('/feeds-data.json');
      if (response.ok) {
        const preFetched = await response.json();
        if (preFetched && preFetched.length > 0) {
          await saveStoredArticles(preFetched);
          return preFetched;
        }
      }
    } catch (e) {
      console.warn("Failed to load /feeds-data.json fallback:", e);
    }
  }

  // Fetch dynamic feeds in parallel
  const promises = feeds.map(async (feed) => {
    try {
      return await fetchFeedArticles(feed);
    } catch (e) {
      console.warn(`Error loading feed ${feed.title}:`, e);
      return [];
    }
  });

  const results = await Promise.all(promises);
  const allArticles = results.flat();

  // Sort by date descending
  allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Store in cache
  await saveStoredArticles(allArticles);

  return allArticles;
}

export async function fetchFullArticleText(url: string): Promise<FullArticle> {
  const cached = await getStoredFullArticle(url);
  if (cached) {
    return cached;
  }

  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch article page: ${response.statusText}`);
  }
  const htmlText = await response.text();

  // Parse html with native DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  
  // Set absolute paths for relative assets (images/anchors)
  const base = doc.createElement('base');
  base.href = url;
  doc.head.append(base);

  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article) {
    throw new Error("Could not parse main content of this webpage.");
  }

  const result: FullArticle = {
    title: article.title || '',
    content: article.content || '',
    textContent: article.textContent || '',
    excerpt: article.excerpt || '',
    byline: article.byline || ''
  };

  await saveStoredFullArticle(url, result);
  return result;
}

// Dynamic Feed Management Utilities
export async function loadFeedsConfig(): Promise<FeedConfig[]> {
  const stored = await getStoredFeeds();
  if (stored && stored.length > 0) {
    // If the database has the old dev.to feed, upgrade user automatically to the new feeds and categories
    const hasDevTo = stored.some(feed => feed.url === "https://dev.to/feed");
    if (hasDevTo) {
      await clearStoredFeeds();
      for (const feed of FEEDS) {
        await saveStoredFeed(feed);
      }
      return FEEDS;
    }

    // Migrate to remove Hugging Face blog if it is cached in IndexedDB
    const hasHuggingFace = stored.some(feed => feed.url === "https://huggingface.co/blog/feed.xml");
    if (hasHuggingFace) {
      await deleteStoredFeed("https://huggingface.co/blog/feed.xml");
      return stored.filter(feed => feed.url !== "https://huggingface.co/blog/feed.xml");
    }
    return stored;
  }
  
  // Initialize with defaults if database is empty
  for (const feed of FEEDS) {
    await saveStoredFeed(feed);
  }
  return FEEDS;
}

export async function addCustomFeed(feed: FeedConfig): Promise<void> {
  await saveStoredFeed(feed);
}

export async function removeCustomFeed(url: string): Promise<void> {
  await deleteStoredFeed(url);
}

export async function resetDefaultFeeds(): Promise<FeedConfig[]> {
  await clearStoredFeeds();
  for (const feed of FEEDS) {
    await saveStoredFeed(feed);
  }
  return FEEDS;
}
