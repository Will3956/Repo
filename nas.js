// api/nas.js — Vercel serverless proxy for FileBrowser
// Browser calls /api/nas/* → this function → your NAS (no CORS issues)

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const NAS_URL  = process.env.NAS_URL  || '';
  const NAS_USER = process.env.NAS_USER || 'admin';
  const NAS_PASS = process.env.NAS_PASS || '';

  if (!NAS_URL) {
    res.status(500).json({ error: 'NAS_URL not configured' });
    return;
  }

  // Strip the /api/nas prefix to get the FileBrowser path
  const fbPath = req.url.replace(/^\/api\/nas/, '') || '/';

  const targetUrl = NAS_URL.replace(/\/$/, '') + fbPath;

  // Forward all headers except host
  const forwardHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k === 'host') continue;
    forwardHeaders[k] = v;
  }

  // Read body for POST/PUT/PATCH
  let body = null;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  try {
    const fbRes = await fetch(targetUrl, {
      method:  req.method,
      headers: forwardHeaders,
      body:    body && body.length > 0 ? body : undefined,
      redirect: 'follow',
    });

    // Forward response headers (skip ones that cause issues)
    const skipHeaders = new Set(['transfer-encoding', 'connection', 'keep-alive']);
    fbRes.headers.forEach((v, k) => {
      if (!skipHeaders.has(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });

    // Always allow the Vercel origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    res.status(fbRes.status);

    const buf = Buffer.from(await fbRes.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.status(502).json({ error: 'Proxy error: ' + err.message });
  }
}
