# FeedMind 📡🧠

FeedMind is a modern, high-performance, **local-first RSS feed aggregator and reader** optimized for tech news and academic research. It features intelligent story clustering, a progressive offline-first architecture, responsive mobile layouts, and optional AI-powered summaries and quizzes.

🔗 **Live Application:** [https://swenfei-feedmind.vercel.app](https://swenfei-feedmind.vercel.app)

---

## Key Features 🚀

### 📁 Local-First & Privacy-Focused
* **Zero Tracking Servers:** Subscriptions, read history, and bookmarked articles are stored entirely on your device inside **IndexedDB**.
* **Encrypted Keys:** Your AI API keys are saved securely in your browser's local storage and are only sent directly to your configured provider.
* **Terms & Privacy built-in:** Visual overlays outline the app's local data isolation policies.

### 📚 Premium Reading Experience
* **Clustered Coverage:** Groups similar news stories from multiple feeds together to avoid feed clutter.
* **Academic Author Formatting:** Automatically parses massive academic author lists (e.g. arXiv feeds) into clean `First Author et al.` formats.
* **Readability View:** Extracts full article text content, stripping out blog header clutters, navigation links, and screen-reader visual noise.
* **Bookmarks & Stars:** Star stories to save them locally, and browse them under a dedicated **Bookmarks** category.
* **Read / Unread States:** Glow-pulsing unread indicator dots keep track of new articles, fading read cards to `0.55` opacity.
* **Filter Read Content:** A top-bar toggle lets you filter out read articles to focus strictly on fresh material.

### 🤖 Optional AI Study Assistant
* **tl;dr Summaries:** Get instant summaries and key takeaways of long research papers or articles.
* **Jargon Glossary:** Extracts key terms and provides definitions.
* **ELI5 Analogies:** Generates "Explain Like I'm 5" explanations for complex academic papers.
* **Interactive Quizzes:** Creates multiple-choice questions with explanations to test your comprehension.
* **Granular Toggle:** A settings control lets you completely turn off all AI capabilities, turning FeedMind into a pure, lightweight traditional reader.

### 📱 Progressive Web App (PWA)
* **Installable:** Install FeedMind as a native app on iOS, Android, and Desktop (runs in standalone mode without browser headers).
* **Service Worker Caching (`sw.js`):** Implements Stale-While-Revalidate caching of app assets so it loads instantly and works offline.
* **Mobile-Responsive UI:** Implements a slide-over navigation drawer, single-column mobile grids, and responsive top-bar wrapping designed to look premium on all screens.

---

## Technology Stack 🛠️

* **Frontend:** React, TypeScript, Vite
* **Styles:** Vanilla CSS (custom variables, modern grids, responsive flex layouts)
* **Icons:** Lucide React
* **Database:** IndexedDB (raw client-side storage)
* **PWA:** Service Workers, Web Manifest (Favicon SVG)
* **Deployment:** Vercel

---

## Local Development 💻

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TeddyHuZz/feedmind.git
   cd feedmind
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Run the development server:**
   ```bash
   pnpm run dev
   ```

4. **Build for production:**
   ```bash
   pnpm run build
   ```

---

## License 📄

This project is open-source and available under the [MIT License](LICENSE).
