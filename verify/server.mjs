import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { assetVersion, bustReferences } from "./bust.mjs";
import { ROOT, publishedRelPaths } from "./files.mjs";

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const published = new Set(publishedRelPaths());
const notFound = path.join(ROOT, "404.html");
const version = assetVersion();

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".ico")) return "image/x-icon";
  if (file.endsWith(".woff2")) return "font/woff2";
  if (file.endsWith(".webmanifest")) return "application/manifest+json";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function sendFile(res, status, file) {
  let body = fs.readFileSync(file);
  if (file.endsWith(".html") || file.endsWith(".css")) {
    body = Buffer.from(bustReferences(body.toString("utf8"), version));
  }
  res.writeHead(status, {
    "content-type": contentType(file),
    "content-length": body.length,
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname = "/";
  let search = "";
  try {
    const url = new URL(req.url || "/", `http://${host}:${port}`);
    pathname = url.pathname;
    search = url.search;
  } catch {
    sendFile(res, 404, notFound);
    return;
  }
  if (pathname === "/") pathname = "/index.html";
  let rel = pathname;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    sendFile(res, 404, notFound);
    return;
  }
  const cleaned = path.posix.normalize(rel).replace(/^\/+/, "");
  if (cleaned === "resources.html") {
    res.writeHead(301, { Location: "/store.html" + search });
    res.end();
    return;
  }
  const abs = path.resolve(ROOT, cleaned);
  const inside = abs === ROOT || abs.startsWith(ROOT + path.sep);
  if (!inside || cleaned.includes("..") || !published.has(cleaned) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    sendFile(res, 404, notFound);
    return;
  }
  sendFile(res, 200, abs);
});

server.listen(port, host, () => {
  console.log(`ready http://${host}:${port}`);
});
