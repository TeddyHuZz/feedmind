import { getEmbeddings } from './ai';
import { Article } from './feed';

export interface Cluster {
  id: string;
  leadArticle: Article;
  articles: Article[];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

export async function clusterArticles(articles: Article[]): Promise<Cluster[]> {
  if (articles.length === 0) return [];

  // Read cached embeddings from sessionStorage
  const cachedEmbeddingsMap: { [link: string]: number[] } = {};
  const cacheKey = 'feedmind_embeddings';
  const cachedJson = sessionStorage.getItem(cacheKey);
  if (cachedJson) {
    try {
      Object.assign(cachedEmbeddingsMap, JSON.parse(cachedJson));
    } catch (e) {
      console.error("Failed to parse cached embeddings", e);
    }
  }

  // Identify which articles need embedding generation
  const articlesToEmbed: Article[] = [];
  const textsToEmbed: string[] = [];

  articles.forEach(article => {
    if (!cachedEmbeddingsMap[article.link]) {
      articlesToEmbed.push(article);
      // Combine title and snippet to give rich semantic context
      textsToEmbed.push(`${article.title}. ${article.contentSnippet}`);
    }
  });

  // Fetch embeddings from worker if needed
  if (articlesToEmbed.length > 0) {
    try {
      console.log(`Generating embeddings for ${articlesToEmbed.length} articles...`);
      const newEmbeddings = await getEmbeddings(textsToEmbed);
      
      newEmbeddings.forEach((emb, index) => {
        const article = articlesToEmbed[index];
        cachedEmbeddingsMap[article.link] = emb;
      });

      // Update cache
      sessionStorage.setItem(cacheKey, JSON.stringify(cachedEmbeddingsMap));
    } catch (e) {
      console.error("Error generating embeddings for clustering:", e);
      // Fallback: return each article in its own cluster
      return articles.map(art => ({
        id: `c_${art.id}`,
        leadArticle: art,
        articles: [art]
      }));
    }
  }

  // Cluster articles based on cosine similarity
  const clusters: Cluster[] = [];
  const similarityThreshold = 0.55; // Tuned for sentence-transformers all-MiniLM-L6-v2

  articles.forEach(article => {
    const embedding = cachedEmbeddingsMap[article.link];
    if (!embedding) {
      clusters.push({
        id: `c_${article.id}`,
        leadArticle: article,
        articles: [article]
      });
      return;
    }

    let matchedCluster: Cluster | null = null;
    let maxSim = -1;

    clusters.forEach(cluster => {
      const leadEmb = cachedEmbeddingsMap[cluster.leadArticle.link];
      if (leadEmb) {
        const sim = cosineSimilarity(embedding, leadEmb);
        if (sim > similarityThreshold && sim > maxSim) {
          maxSim = sim;
          matchedCluster = cluster;
        }
      }
    });

    if (matchedCluster) {
      const cluster = matchedCluster as Cluster;
      cluster.articles.push(article);
      
      // If this article is more recent, promote it to be the lead article of the cluster
      if (new Date(article.pubDate).getTime() > new Date(cluster.leadArticle.pubDate).getTime()) {
        cluster.leadArticle = article;
      }
    } else {
      clusters.push({
        id: `c_${article.id}`,
        leadArticle: article,
        articles: [article]
      });
    }
  });

  // Sort nested items and parent clusters by date
  clusters.forEach(c => {
    c.articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  });

  clusters.sort((a, b) => new Date(b.leadArticle.pubDate).getTime() - new Date(a.leadArticle.pubDate).getTime());

  return clusters;
}
