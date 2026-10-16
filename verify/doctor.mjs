import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copy } from "./catalog.mjs";
import { ROOT } from "./files.mjs";

const local = !process.env.BASE_URL;
const base = (process.env.BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
let child;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function waitForHome() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/`);
      if (res.status === 200) return;
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
      if (code !== "ECONNREFUSED") throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`nothing answered ${base}/`);
}

async function main() {
  if (local) {
    child = spawn(process.execPath, ["verify/server.mjs"], {
      cwd: ROOT,
      stdio: "ignore",
    });
    await waitForHome();
  }
  const home = await fetch(`${base}/`);
  const html = await home.text();
  if (home.status !== 200) {
    fail(`home status ${home.status} at ${base}/`);
    return;
  }
  if (html.includes("Design mockup for owner review")) {
    fail("home still shows the mockup bar");
    return;
  }
  if (html.includes('name="robots" content="noindex"')) {
    fail("home still asks crawlers not to index");
    return;
  }
  if (!html.includes(`property="og:image" content="${copy.ogImage}"`)) {
    fail("home og:image is not the absolute share image");
    return;
  }
  const robots = await fetch(`${base}/robots.txt`);
  const body = await robots.text();
  if (robots.status !== 200 || body !== copy.robots) {
    fail(`robots.txt at ${base} is ${JSON.stringify(body)}`);
    return;
  }
  const sitemap = await fetch(`${base}/sitemap.xml`);
  const map = await sitemap.text();
  if (sitemap.status !== 200 || !map.includes("https://www.griffinandquill.com/")) {
    fail(`sitemap.xml at ${base} is status ${sitemap.status}`);
    return;
  }
  const icon = await fetch(`${base}/favicon.ico`);
  if (icon.status !== 200) {
    fail(`favicon.ico status ${icon.status}`);
    return;
  }
  console.log(`doctor ok ${base}`);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
if (path.resolve(scriptDir, "..") !== ROOT) {
  fail("doctor is not running from the repo copy of verify/");
} else {
  main()
    .catch((error) => fail(error.message))
    .finally(() => {
      if (child && child.exitCode === null && !child.killed) child.kill();
    });
}
