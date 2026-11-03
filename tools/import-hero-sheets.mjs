// Copy packed hero atlases into this site.
//
//   node tools/import-hero-sheets.mjs <hero-dist>
//   node tools/import-hero-sheets.mjs --check
//
// <hero-dist>/atlases is the folder scripts/pack-atlases.mjs writes.
// This script copies only manifest.json and hero-*.png / hero-*.json
// into img/quillhaven/hero/. It does not download art and it does not
// edit the page. The banner loads those files and draws the greybox
// stand-in when the folder is empty.
//
// --check exits 1 if img/quillhaven/hero contains anything else.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destDir = path.join(root, "img", "quillhaven", "hero");
const atlasName = /^(manifest\.json|hero-[a-z0-9-]+\.(png|json))$/;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function isAtlasFile(name) {
  return atlasName.test(name);
}

function checkDest() {
  if (!fs.existsSync(destDir)) {
    console.log("hero sheet check ok (no packed sheets directory)");
    return;
  }
  const names = fs.readdirSync(destDir);
  for (const name of names) {
    const abs = path.join(destDir, name);
    if (!fs.statSync(abs).isFile()) fail(`hero sheet check: unexpected directory ${name}`);
    if (!isAtlasFile(name)) fail(`hero sheet check: ${name} is not a hero atlas file`);
  }
  console.log(`hero sheet check ok (${names.length} file${names.length === 1 ? "" : "s"})`);
}

function copyAtlases(atlasDir) {
  const names = fs.readdirSync(atlasDir).filter(isAtlasFile);
  if (!names.includes("manifest.json")) fail(`No manifest.json in ${atlasDir}`);
  fs.mkdirSync(destDir, { recursive: true });
  if (fs.existsSync(destDir)) {
    for (const name of fs.readdirSync(destDir)) {
      const abs = path.join(destDir, name);
      if (fs.statSync(abs).isFile() && !names.includes(name)) fs.unlinkSync(abs);
    }
  }
  for (const name of names) {
    const from = path.join(atlasDir, name);
    if (!fs.statSync(from).isFile()) fail(`missing atlas file ${name}`);
    fs.copyFileSync(from, path.join(destDir, name));
  }
  return names.length;
}

const arg = process.argv[2];
if (!arg || arg === "--check") {
  if (arg === "--check") checkDest();
  else console.log("No hero build directory given. The Quillhaven page keeps the greybox town square.");
  process.exit(0);
}

const heroDist = path.resolve(arg);
const atlasDir = path.join(heroDist, "atlases");
if (!fs.existsSync(atlasDir) || !fs.statSync(atlasDir).isDirectory()) {
  console.log(`No atlases directory at ${atlasDir}. The Quillhaven page keeps the greybox town square.`);
  process.exit(0);
}

const count = copyAtlases(atlasDir);
checkDest();
console.log(`Copied ${count} hero atlas files into img/quillhaven/hero. The banner loads them instead of the greybox.`);
