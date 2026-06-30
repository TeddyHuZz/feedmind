import { Article } from './feed';

export interface ClusteredArticle extends Article {
  subArticles?: Article[];
}

export function clusterArticles(articles: Article[]): ClusteredArticle[] {
  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'your', 'that', 'this', 'from', 'about',
    'how', 'why', 'what', 'who', 'when', 'where', 'into', 'over', 'than',
    'then', 'them', 'they', 'their', 'there', 'these', 'those',
    'will', 'would', 'could', 'should', 'have', 'has', 'had', 'been', 'were',
    'was', 'are', 'is', 'am', 'but', 'not', 'new', 'latest', 'best', 'top',
    'a', 'an', 'of', 'in', 'on', 'at', 'by', 'to', 'or', 'as', 'if'
  ]);

  const getKeywords = (title: string): string[] => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length >= 4 && !stopwords.has(word));
  };

  // 1. Sort articles by date descending
  const sorted = [...articles].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // 2. Precompute keywords and timestamps once
  const precomputed = sorted.map(art => ({
    article: art,
    keywords: getKeywords(art.title),
    time: new Date(art.pubDate).getTime()
  }));

  const clustered: ClusteredArticle[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < precomputed.length; i++) {
    const current = precomputed[i];
    if (visited.has(current.article.id)) continue;

    const cluster: ClusteredArticle = { ...current.article, subArticles: [] };
    visited.add(current.article.id);
    const keywordsA = current.keywords;
    const timeA = current.time;

    // Find similar articles in the list
    for (let j = i + 1; j < precomputed.length; j++) {
      const other = precomputed[j];
      if (visited.has(other.article.id)) continue;

      // Group if published within 48 hours
      const timeB = other.time;
      const hoursDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60);
      if (hoursDiff > 48) continue;

      // Group if they share at least 2 significant title terms
      const keywordsB = other.keywords;
      const overlap = keywordsA.filter(kw => keywordsB.includes(kw));

      if (overlap.length >= 2) {
        cluster.subArticles!.push(other.article);
        visited.add(other.article.id);
      }
    }

    clustered.push(cluster);
  }

  return clustered;
}
