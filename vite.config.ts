import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/proxy')) {
            const url = new URL(req.url, 'http://localhost:3000');
            const targetUrl = url.searchParams.get('url');
            if (!targetUrl) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }
            try {
              const decodedUrl = decodeURIComponent(targetUrl);
              const response = await fetch(decodedUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
              });
              if (!response.ok) {
                res.writeHead(response.status);
                res.end(`Failed to fetch URL: ${response.statusText}`);
                return;
              }
              const contentType = response.headers.get('content-type');
              if (contentType) {
                res.setHeader('Content-Type', contentType);
              }
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              
              const body = await response.text();
              res.writeHead(200);
              res.end(body);
            } catch (error: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 3000
  }
});
