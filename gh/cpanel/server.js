// Zero-dependency static server for a Vite SPA (P-Stream) on cPanel "Setup Node.js App".
// Serves ./dist, falls back to index.html for client-side routes.
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".map": "application/json",
};
const COMPRESSIBLE = new Set([".html", ".js", ".mjs", ".css", ".json", ".webmanifest", ".svg", ".txt", ".xml", ".map"]);

function resolveFile(urlPath) {
  let p;
  try {
    p = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null;
  }
  const full = path.normalize(path.join(ROOT, p));
  if (!full.startsWith(ROOT)) return null; // block path traversal
  try {
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      const idx = path.join(full, "index.html");
      return fs.existsSync(idx) ? idx : null;
    }
    return full;
  } catch {
    return null;
  }
}

http
  .createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end();
    }

    const reqPath = req.url || "/";
    let file = resolveFile(reqPath);
    let spaFallback = false;
    if (!file) {
      // Missing asset (has an extension) -> real 404; anything else -> SPA index
      if (path.extname(reqPath.split("?")[0])) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Not found");
      }
      file = path.join(ROOT, "index.html");
      spaFallback = true;
    }

    const ext = path.extname(file).toLowerCase();
    const headers = {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "origin-when-cross-origin",
      "Cache-Control":
        file.includes(`${path.sep}assets${path.sep}`) && !spaFallback
          ? "public, max-age=31536000, immutable"
          : "public, max-age=0, must-revalidate",
    };

    let stream;
    try {
      stream = fs.createReadStream(file);
    } catch {
      res.writeHead(500);
      return res.end("Server error");
    }
    stream.on("error", () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });

    const accept = req.headers["accept-encoding"] || "";
    if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(accept)) {
      headers["Content-Encoding"] = "gzip";
      headers["Vary"] = "Accept-Encoding";
      res.writeHead(200, headers);
      if (req.method === "HEAD") return res.end();
      stream.pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, headers);
      if (req.method === "HEAD") return res.end();
      stream.pipe(res);
    }
  })
  .listen(PORT, () => console.log(`Serving ${ROOT} on ${PORT}`));
