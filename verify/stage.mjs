import fs from "node:fs";
import path from "node:path";
import { assetVersion, bustReferences } from "./bust.mjs";
import { ROOT, publishedRelPaths } from "./files.mjs";

const dest = path.join(ROOT, "_site");
const version = assetVersion();
fs.rmSync(dest, { recursive: true, force: true });
const files = publishedRelPaths();
for (const rel of files) {
  const from = path.join(ROOT, rel);
  const to = path.join(dest, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (rel.endsWith(".html") || rel.endsWith(".css")) {
    const text = fs.readFileSync(from, "utf8");
    fs.writeFileSync(to, bustReferences(text, version));
  } else {
    fs.copyFileSync(from, to);
  }
}
console.log(`staged ${files.length} files into _site (v=${version})`);
