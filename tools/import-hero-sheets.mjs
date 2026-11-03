// Copy packed sprite sheets from a Quillhaven hero build into this site.
//
//   node tools/import-hero-sheets.mjs /path/to/quillhaven/site/quillhaven-hero/dist
//   node tools/import-hero-sheets.mjs --check
//
// The hero build must already have written manifest.json plus the png or webp
// files that manifest names. This script does not download art, and it does not
// accept archives or file names with spaces or parent-directory segments.
//
// manifest.json shape:
//   { "version": 1, "sprites": { "academy": { "src": "academy.png", "w": 96, "h": 80, "frames": 1 } } }
// Sprite ids the banner knows: academy, house, stall, tree, lamp, torch, bench, fountain, folk.
// folk is a strip of rows (one townsfolk each) and frames across.
//
// With no directory, or when that directory is missing, the script leaves the
// page on the greybox scene and exits 0. --check checks files already copied
// into img/quillhaven/hero and exits 1 if one is not a packed sheet.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destDir = path.join(root, "img", "quillhaven", "hero");
const pagePath = path.join(root, "worlds.html");
const allowedName = /^(manifest\.json|.+\.(png|webp))$/i;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function isPackedName(name) {
  if (!name || name !== path.basename(name)) return false;
  if (name.includes("..") || /\s/.test(name)) return false;
  return allowedName.test(name);
}

function checkDest() {
  if (!fs.existsSync(destDir)) {
    console.log("hero sheet check ok (no packed sheets directory)");
    return;
  }
  const names = fs.readdirSync(destDir);
  for (const name of names) {
    const abs = path.join(destDir, name);
    if (fs.statSync(abs).isDirectory()) fail(`hero sheet check: unexpected directory ${name}`);
    if (!isPackedName(name)) fail(`hero sheet check: ${name} is not a packed sheet`);
  }
  console.log(`hero sheet check ok (${names.length} file${names.length === 1 ? "" : "s"})`);
}

function readManifest(dir) {
  const file = path.join(dir, "manifest.json");
  if (!fs.existsSync(file)) fail(`No manifest.json in ${dir}`);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`manifest.json is not JSON (${error.message})`);
  }
  if (!manifest || manifest.version !== 1 || !manifest.sprites || typeof manifest.sprites !== "object") {
    fail("manifest.json must be version 1 with a sprites object");
  }
  const srcs = new Set(["manifest.json"]);
  for (const id of Object.keys(manifest.sprites)) {
    const spec = manifest.sprites[id];
    if (!spec || typeof spec.src !== "string" || !isPackedName(spec.src) || !/\.(png|webp)$/i.test(spec.src)) {
      fail(`sprite ${id} needs a png or webp file name with no path`);
    }
    srcs.add(spec.src);
  }
  return { manifest, srcs };
}

function pointPageAtSheets() {
  const html = fs.readFileSync(pagePath, "utf8");
  const next = html.replace(
    /<canvas class="town-square-canvas"[^>]*>/,
    '<canvas class="town-square-canvas" width="480" height="220" aria-hidden="true" data-art="sheets" data-sheets="img/quillhaven/hero/manifest.json">',
  );
  if (next === html) fail("worlds.html has no town-square canvas to point at the sheets");
  fs.writeFileSync(pagePath, next);
}

const arg = process.argv[2];
if (!arg || arg === "--check") {
  if (arg === "--check") checkDest();
  else console.log("No hero build directory given. The Quillhaven page keeps the greybox town square.");
  process.exit(0);
}

const sourceDir = path.resolve(arg);
if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
  console.log(`No hero build at ${sourceDir}. The Quillhaven page keeps the greybox town square.`);
  process.exit(0);
}

const { srcs } = readManifest(sourceDir);
fs.mkdirSync(destDir, { recursive: true });
for (const name of fs.readdirSync(destDir)) {
  const abs = path.join(destDir, name);
  if (fs.statSync(abs).isFile() && !srcs.has(name)) fs.unlinkSync(abs);
}
for (const name of srcs) {
  const from = path.join(sourceDir, name);
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) fail(`missing packed file ${name}`);
  fs.copyFileSync(from, path.join(destDir, name));
}
pointPageAtSheets();
checkDest();
console.log(`Copied ${srcs.size} packed hero files into img/quillhaven/hero. The banner will use them instead of the greybox.`);
