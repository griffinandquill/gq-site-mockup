import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ASSET_FILES = ["favicon.svg", "robots.txt", ".nojekyll"];
const ASSET_DIRS = ["css", "js", "assets", "fonts", "img"];

export function rootHtmlFiles() {
  return fs
    .readdirSync(ROOT)
    .filter((name) => name.endsWith(".html"))
    .sort();
}

function walk(dir, prefix) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = `${prefix}/${name}`;
    if (fs.statSync(abs).isDirectory()) out.push(...walk(abs, rel));
    else out.push(rel);
  }
  return out;
}

export function publishedRelPaths() {
  const html = rootHtmlFiles();
  const assets = ASSET_FILES.filter((name) => fs.existsSync(path.join(ROOT, name)));
  const nested = ASSET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir), dir));
  return [...html, ...assets, ...nested].sort();
}
