export default async function handler(req, res) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    
    // Safety check for URL protocol
    if (!decodedUrl.startsWith("http://") && !decodedUrl.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid URL protocol. Must be HTTP or HTTPS." });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch URL: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    
    const body = await response.text();
    return res.status(200).send(body);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
