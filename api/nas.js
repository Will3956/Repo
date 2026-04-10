// api/nas.js — Vercel serverless proxy for FileBrowser
// Handles all requests to /api/nas/* and forwards them to the NAS server-side
// This sidesteps CORS entirely since the proxy is server-to-server

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  const NAS_URL  = process.env.NAS_URL  || '';
  const NAS_USER = process.env.NAS_USER || 'admin';
  const NAS_PASS = process.env.NAS_PASS || '';

  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!NAS_URL) {
    res.status(500).json({ error: 'NAS_URL environment variable not set' });
    return;
  }

  // Strip /api/nas prefix to get the FileBrowser path
  // req.url might be /api/nas/api/login → we want /api/login
  const fbPath = req.url.replace(/^\/api\/nas/, '') || '/';
  const targetUrl = NAS_URL.replace(/\/$/, '') + fbPath;

  // Forward headers, drop host (causes issues with proxying)
  const forwardHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (['host', 'connection'].includes(k.toLowerCase())) continue;
    forwardHeaders[k] = v;
  }

  // Read body for mutating methods
  let body = undefined;
  if (!['GET', 'HEAD', 'DELETE'].includes(req.method)) {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
    if (body.length === 0) body = undefined;
  }

  try {
    const fbRes = await fetch(targetUrl, {
      method:  req.method,
      headers: forwardHeaders,
      body,
      redirect: 'follow',
    });

    // Forward safe response headers
    const skipHeaders = new Set(['transfer-encoding', 'connection', 'keep-alive', 'content-encoding']);
    fbRes.headers.forEach((v, k) => {
      if (!skipHeaders.has(k.toLowerCase())) res.setHeader(k, v);
    });

    res.status(fbRes.status);
    const buf = Buffer.from(await fbRes.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.status(502).json({ error: 'Proxy error: ' + err.message });
  }
}
