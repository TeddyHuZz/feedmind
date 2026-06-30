import { FeedConfig, Article, FullArticle } from './feed';

const DB_NAME = 'FeedMindDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export function initDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('feeds')) {
        db.createObjectStore('feeds', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('articles')) {
        db.createObjectStore('articles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('fullArticles')) {
        db.createObjectStore('fullArticles', { keyPath: 'url' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

function getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return initDb().then((db) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  });
}

// Feeds CRUD
export async function getStoredFeeds(): Promise<FeedConfig[]> {
  const store = await getStore('feeds', 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStoredFeed(feed: FeedConfig): Promise<void> {
  const store = await getStore('feeds', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(feed);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteStoredFeed(url: string): Promise<void> {
  const store = await getStore('feeds', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(url);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStoredFeeds(): Promise<void> {
  const store = await getStore('feeds', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Articles Cache CRUD
export async function getStoredArticles(): Promise<Article[]> {
  const store = await getStore('articles', 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStoredArticles(articles: Article[]): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('articles', 'readwrite');
    const store = transaction.objectStore('articles');
    
    // Clear and put new ones to ensure cache remains synced
    store.clear();
    articles.forEach(article => {
      store.put(article);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function clearStoredArticles(): Promise<void> {
  const store = await getStore('articles', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Full Text Extraction Cache
export async function getStoredFullArticle(url: string): Promise<FullArticle | null> {
  const store = await getStore('fullArticles', 'readonly');
  return new Promise((resolve) => {
    const request = store.get(url);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null); // Fallback on error
  });
}

export async function saveStoredFullArticle(url: string, article: FullArticle): Promise<void> {
  const store = await getStore('fullArticles', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put({ ...article, url });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
