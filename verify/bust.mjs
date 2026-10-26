import { execFileSync } from "node:child_process";
import { ROOT } from "./files.mjs";

export function assetVersion() {
  if (process.env.ASSET_VERSION) return process.env.ASSET_VERSION;
  try {
    return execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    return `${now.getUTCFullYear()}${month}${day}`;
  }
}

export function bustReferences(text, version) {
  const suffix = `?v=${version}`;
  const htmlRef =
    /(href|src)="(css\/[^"?]+\.css|js\/[^"?]+\.js|img\/(?:characters|buildings|quillhaven\/sprites)\/[^"?]+|data\/[^"?]+\.json)"/g;
  const cssUrl =
    /url\((["']?)((?:\.\.\/)?img\/(?:characters|buildings|quillhaven\/sprites)\/[^"'()\s?]+)(\1)\)/g;
  return text
    .replace(htmlRef, (_, attr, url) => `${attr}="${url}${suffix}"`)
    .replace(cssUrl, (_, open, url, close) => `url(${open}${url}${suffix}${close})`);
}
