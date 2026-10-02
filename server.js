// Case Coach — dependency-free Node server (Node 20.6+).
// Use this for local development or hosts like Render and Railway.
// On Vercel it isn't used: Vercel serves public/ and runs api/chat.js directly.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { POST } from "./api/chat.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const PORT = process.env.PORT || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

if (!process.env.ANTHROPIC_API_KEY) console.warn("ANTHROPIC_API_KEY is not set — chat requests will fail.");
if (!process.env.ACCESS_CODE) console.warn("ACCESS_CODE is not set — anyone with the URL can use your API key.");

async function chat(req, res) {
  let body = "";
  for await (const chunk of req) body += chunk;
  const request = new Request("http://localhost/api/chat", { method: "POST", headers: req.headers, body });
  const response = await POST(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
}

http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/chat") return await chat(req, res);
    const path = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
    const file = join(ROOT, path === "/" ? "index.html" : path);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(data);
  } catch (e) {
    if (!res.headersSent) res.writeHead(e.code === "ENOENT" ? 404 : 500).end();
  }
}).listen(PORT, () => console.log(`Case Coach running at http://localhost:${PORT}`));
