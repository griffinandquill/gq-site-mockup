import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { copy, forms, pages, viewports } from "../verify/catalog.mjs";
import { assetVersion, bustReferences } from "../verify/bust.mjs";
import { ROOT, publishedRelPaths, rootHtmlFiles } from "../verify/files.mjs";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

function unexpected(errors: string[], allowDocument404: boolean) {
  return errors.filter((text) => {
    if (!allowDocument404) return true;
    return !(/Failed to load resource/i.test(text) && text.includes("404"));
  });
}

async function fillField(
  region: ReturnType<Page["locator"]>,
  field: (typeof forms)[number]["fields"][number],
) {
  if (field.kind === "select") {
    await region.getByLabel(field.label, { exact: true }).selectOption({ label: field.value });
    return;
  }
  if (field.kind === "radio") {
    await region.getByRole("radio", { name: field.label, exact: true }).check();
    return;
  }
  await region.getByLabel(field.label, { exact: true }).fill(field.value);
}

test("catalog lists every root html file", () => {
  expect(pages.map((page) => page.file).sort()).toEqual(rootHtmlFiles());
});

test("stage copies site bytes and leaves the checker out", () => {
  execFileSync(process.execPath, ["verify/stage.mjs"], { cwd: ROOT });
  const version = assetVersion();
  for (const rel of publishedRelPaths()) {
    const source = fs.readFileSync(path.join(ROOT, rel));
    const staged = fs.readFileSync(path.join(ROOT, "_site", rel));
    const expected =
      rel.endsWith(".html") || rel.endsWith(".css")
        ? Buffer.from(bustReferences(source.toString("utf8"), version))
        : source;
    expect(Buffer.compare(expected, staged), rel).toBe(0);
  }
  const worlds = fs.readFileSync(path.join(ROOT, "_site", "worlds.html"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "_site", "css", "styles.css"), "utf8");
  const shop = fs.readFileSync(path.join(ROOT, "_site", "resources.html"), "utf8");
  expect(worlds).toContain(`href="css/styles.css?v=${version}"`);
  expect(worlds).toContain(`src="js/main.js?v=${version}"`);
  expect(worlds).toContain(`src="img/characters/tahne.png?v=${version}"`);
  expect(worlds).toContain(`src="img/buildings/academy.png?v=${version}"`);
  expect(worlds).toContain('src="assets/logo-icon.svg"');
  expect(css).toContain(`bramble-idle.png?v=${version}`);
  expect(shop).toContain(`src="js/products.js?v=${version}"`);
  expect(fs.existsSync(path.join(ROOT, "_site", "package.json"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "verify"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "tests"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "README.md"))).toBe(false);
});

test("robots.txt disallows every path", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe(copy.robots);
});

for (const entry of pages) {
  for (const viewport of viewports) {
    test(`${entry.file} loads at ${viewport.id}`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(`/${entry.file}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(entry.title);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.locator(".mockup-bar")).toHaveText(copy.mockupBar);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
      const current = page.locator('#site-nav a[aria-current="page"]');
      if (entry.nav) {
        await expect(current).toHaveCount(1);
        await expect(current).toHaveText(entry.nav);
      } else {
        await expect(current).toHaveCount(0);
      }
      const axe = await new AxeBuilder({ page }).analyze();
      const serious = axe.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      );
      expect(serious.map((violation) => violation.id)).toEqual([]);
      expect(unexpected(errors, false)).toEqual([]);
    });
  }
}

test("mobile menu opens and an open menu has no serious axe violations", async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  const toggle = page.locator(".nav-toggle");
  const nav = page.locator("#site-nav");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(nav.getByRole("link", { name: "Tutoring", exact: true })).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toContainText("Close");
  await expect(nav.getByRole("link", { name: "Home", exact: true })).toBeFocused();
  await expect(nav.getByRole("link", { name: "Tutoring", exact: true })).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious.map((violation) => violation.id)).toEqual([]);
  await page.screenshot({ path: "verify-results/menu-open.png" });
  await nav.getByRole("link", { name: "Tutoring", exact: true }).click();
  await expect(page).toHaveURL(/\/tutoring\.html$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(unexpected(errors, false)).toEqual([]);
});

test("escape, an outside click, and a wide window close the menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/faq.html");
  const toggle = page.locator(".nav-toggle");
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator(".mockup-bar").click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(toggle).toBeHidden();
  await expect(page.locator("#site-nav")).not.toHaveClass(/is-open/);
});

test("the menu toggle exists at 1000px and is gone at 1001px", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto("/about.html");
  await expect(page.locator(".nav-toggle")).toBeVisible();
  await expect(page.locator("#site-nav a").first()).toBeHidden();
  await page.setViewportSize({ width: 1001, height: 800 });
  await expect(page.locator(".nav-toggle")).toBeHidden();
  await expect(page.locator("#site-nav").getByRole("link", { name: "Home", exact: true })).toBeVisible();
});

test("desktop nav follows a header link", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/index.html");
  await expect(page.locator(".nav-toggle")).toBeHidden();
  await page.locator("#site-nav").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact\.html$/);
  await expect(page.locator('#site-nav a[aria-current="page"]')).toHaveText("Contact");
});

for (const form of forms) {
  test(`${form.id} form stays on the page`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(form.page);
    const region = page.locator(form.section);
    const thanks = region.locator("[data-thanks]");
    await expect(region.locator("form[data-mockup]")).toBeVisible();
    await expect(thanks).toBeHidden();
    await region.getByRole("button", { name: form.submit, exact: true }).click();
    await expect(thanks).toBeHidden();
    for (const field of form.fields) await fillField(region, field);
    const before = page.url();
    await region.getByRole("button", { name: form.submit, exact: true }).click();
    await expect(thanks).toBeVisible();
    await expect(thanks).toHaveText(copy.thanks);
    await expect(thanks).toBeFocused();
    expect(page.url()).toBe(before);
    if (form.id === "contact") {
      await page.screenshot({ path: "verify-results/form-thanks.png" });
    }
    expect(unexpected(errors, false)).toEqual([]);
  });
}

test("two faq questions stay open together", async ({ page }) => {
  await page.goto("/faq.html");
  const first = page.locator("details.faq").nth(0);
  const second = page.locator("details.faq").nth(1);
  await first.locator("summary").click();
  await second.locator("summary").click();
  await expect(first).toHaveJSProperty("open", true);
  await expect(second).toHaveJSProperty("open", true);
  await expect(first.locator(".answer")).toBeVisible();
  await expect(second.locator(".answer")).toBeVisible();
  await page.goto("/tutoring.html");
  const tutoring = page.locator("#tutoring-questions details.faq").nth(0);
  await tutoring.locator("summary").click();
  await expect(tutoring).toHaveJSProperty("open", true);
  await expect(tutoring.locator(".answer")).toContainText("online first");
});

test("a placeholder product link notes that nothing opens", async ({ page }) => {
  await page.goto("/resources.html");
  const link = page.getByRole("link", { name: "The Road to Revolution" });
  await link.click();
  const note = page.getByRole("status");
  await expect(note).toHaveCount(1);
  await expect(note).toHaveText(copy.placeholder);
  await link.click();
  await expect(note).toHaveCount(1);
  await expect(page).toHaveURL(/\/resources\.html$/);
});

const sceneNpcs = [
  { name: "Bramble", selector: ".qh-bramble", sheet: "bramble-idle.png" },
  { name: "Merlin", selector: ".qh-merlin", sheet: "merlin-idle.png" },
  { name: "Tahne", selector: ".qh-tahne", sheet: "tahne-idle.png" },
  { name: "Winston", selector: ".qh-winston-east", sheet: "winston-walk-east.png" },
] as const;

test("quillhaven npc sprites have size inside the panorama", async ({ page }) => {
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/worlds.html");
    const scene = page.locator(".qh-scene");
    await expect(scene).toBeVisible();
    for (const npc of sceneNpcs) {
      await scene.evaluate((el, selector) => {
        const node = el.querySelector(selector);
        if (!node) throw new Error(`missing ${selector}`);
        const sceneBox = el.getBoundingClientRect();
        const box = node.getBoundingClientRect();
        const next = el.scrollLeft + (box.left - sceneBox.left) - (el.clientWidth - box.width) / 2;
        el.scrollLeft = Math.max(0, next);
      }, npc.selector);
      const box = await scene.evaluate((el, selector) => {
        const node = el.querySelector(selector);
        if (!node) throw new Error(`missing ${selector}`);
        const sceneBox = el.getBoundingClientRect();
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          sceneLeft: sceneBox.left,
          sceneRight: sceneBox.right,
          sceneTop: sceneBox.top,
          sceneBottom: sceneBox.bottom,
          opacity: style.opacity,
          backgroundImage: style.backgroundImage,
        };
      }, npc.selector);
      expect(box.width, `${npc.name} width at ${width}`).toBeGreaterThan(20);
      expect(box.height, `${npc.name} height at ${width}`).toBeGreaterThan(20);
      expect(box.opacity, npc.name).toBe("1");
      expect(box.backgroundImage, npc.name).toContain(npc.sheet);
      expect(box.left, `${npc.name} left`).toBeGreaterThanOrEqual(box.sceneLeft - 1);
      expect(box.right, `${npc.name} right`).toBeLessThanOrEqual(box.sceneRight + 1);
      expect(box.top, `${npc.name} top`).toBeGreaterThanOrEqual(box.sceneTop - 1);
      expect(box.bottom, `${npc.name} bottom`).toBeLessThanOrEqual(box.sceneBottom + 1);
      await expect(page.locator(npc.selector)).toBeVisible();
    }
  }
});

function creamPixelCount(png: Buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  const chunks: Buffer[] = [];
  while (offset + 8 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === "IDAT") {
      chunks.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  const channels = colorType === 2 ? 3 : 4;
  const inflated = inflateSync(Buffer.concat(chunks));
  const rowSize = width * channels;
  const pixels = Buffer.alloc(width * height * channels);
  let src = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[src];
    src += 1;
    const rowStart = y * rowSize;
    for (let i = 0; i < rowSize; i += 1) {
      const raw = inflated[src];
      src += 1;
      const left = i >= channels ? pixels[rowStart + i - channels] : 0;
      const up = y > 0 ? pixels[rowStart - rowSize + i] : 0;
      const upLeft = y > 0 && i >= channels ? pixels[rowStart - rowSize + i - channels] : 0;
      let value = raw;
      if (filter === 1) value = (raw + left) & 255;
      else if (filter === 2) value = (raw + up) & 255;
      else if (filter === 3) value = (raw + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const guess = left + up - upLeft;
        const leftDist = Math.abs(guess - left);
        const upDist = Math.abs(guess - up);
        const upLeftDist = Math.abs(guess - upLeft);
        const predicted = leftDist <= upDist && leftDist <= upLeftDist ? left : upDist <= upLeftDist ? up : upLeft;
        value = (raw + predicted) & 255;
      }
      pixels[rowStart + i] = value;
    }
  }
  let cream = 0;
  for (let i = 0; i < width * height; i += 1) {
    const red = pixels[i * channels];
    const green = pixels[i * channels + 1];
    const blue = pixels[i * channels + 2];
    if (red > 220 && green > 210 && blue > 190) cream += 1;
  }
  return cream;
}

async function forceVisited(page: Page, selector: string) {
  const client = await page.context().newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const doc = await client.send("DOM.getDocument");
  const { nodeId } = await client.send("DOM.querySelector", {
    nodeId: doc.root.nodeId,
    selector,
  });
  await client.send("CSS.forcePseudoState", {
    nodeId,
    forcedPseudoClasses: ["visited"],
  });
}

test("the quillhaven demo stays unloaded until the poster is pressed", async ({ page }) => {
  await page.route("https://play.griffinandquill.com/**", (route) => route.abort());
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`/worlds.html?view=${width}#play`);
    const stage = page.locator("[data-play-stage]");
    await expect(stage).toBeVisible();
    await expect(stage.locator("iframe")).toHaveCount(0);
    const ratio = await stage.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.width / box.height;
    });
    expect(ratio, `stage ratio at ${width}`).toBeCloseTo(16 / 9, 1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${width}`).toBeLessThanOrEqual(1);
    await expect(page.getByRole("link", { name: "Open full screen" })).toHaveAttribute(
      "href",
      "https://play.griffinandquill.com",
    );
    await expect(page.getByText("It plays best on a computer or tablet with a keyboard.")).toBeVisible();
    await page.getByRole("button", { name: "Play the demo" }).click();
    const frame = stage.locator("iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute("src", "https://play.griffinandquill.com");
    await expect(frame).toHaveAttribute("allow", "fullscreen");
    await expect(stage.locator("[data-play-load]")).toBeHidden();
  }
});

test("visited current nav item keeps its label on the desktop bar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/worlds.html");
  const current = page.locator('#site-nav a[aria-current="page"]');
  await expect(current).toHaveText("Quillhaven");
  const before = creamPixelCount(await current.screenshot());
  expect(before).toBeGreaterThan(40);
  await forceVisited(page, '#site-nav a[aria-current="page"]');
  const after = creamPixelCount(await current.screenshot());
  expect(after).toBeGreaterThan(before * 0.5);
});

test("the home hero logo has no navy plate", async ({ page, request }) => {
  await page.goto("/index.html");
  const hero = page.locator(".logo-hero");
  await expect(hero).toHaveAttribute("src", "assets/logo-hero.svg");
  await expect(page.locator(".brand .logo")).toHaveAttribute("src", "assets/logo-icon.svg");
  const svg = await (await request.get("/assets/logo-hero.svg")).text();
  expect(svg).not.toContain("#1f2a44");
  expect(svg).toContain("#fff");
  expect(svg).toContain("#b8860b");
});

test("the pixel gryphon stays parked when motion is reduced", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  const flight = page.locator(".accent-flight");
  await expect(flight).toBeVisible();
  await expect(flight).not.toHaveClass(/is-flying/);
  const first = await flight.boundingBox();
  await page.waitForTimeout(500);
  const second = await flight.boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  expect(Math.hypot((second?.x ?? 0) - (first?.x ?? 0), (second?.y ?? 0) - (first?.y ?? 0))).toBeLessThan(1);
});

test.describe("home gryphon flight", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the pixel gryphon is present and moves inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/index.html");
    const flight = page.locator(".accent-flight");
    await expect(flight).toBeVisible();
    await expect(flight).toHaveClass(/is-flying/);
    await expect(flight).toHaveCSS("pointer-events", "none");
    const bird = flight.locator(".accent-gryphon");
    await expect(bird).toBeVisible();
    let previous = await flight.boundingBox();
    let moved = 0;
    expect(previous).not.toBeNull();
    for (let i = 0; i < 4; i += 1) {
      await page.waitForTimeout(450);
      const box = await flight.boundingBox();
      expect(box).not.toBeNull();
      if (!box || !previous) continue;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1280);
      expect(box.y + box.height).toBeLessThanOrEqual(800);
      moved = Math.max(moved, Math.hypot(box.x - previous.x, box.y - previous.y));
      previous = box;
    }
    expect(moved).toBeGreaterThan(12);
  });
});

test("a bad path returns the 404 page", async ({ page }) => {
  const errors = collectErrors(page);
  const response = await page.goto("/not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found | Griffin & Quill");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page is not on the mockup.");
  await expect(page.locator(".mockup-bar")).toHaveText(copy.mockupBar);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  expect(unexpected(errors, true)).toEqual([]);
});

test("internal links and assets answer", async ({ page, request }) => {
  const seen = new Set<string>();
  const failures: string[] = [];
  for (const entry of pages) {
    const response = await page.goto(`/${entry.file}`);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("load");
    const hrefs = await page.locator("a[href], link[href], script[src], img[src]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href") || node.getAttribute("src") || ""),
    );
    const here = new URL(page.url());
    for (const href of hrefs) {
      if (!href || href === "#") continue;
      let url: URL;
      try {
        url = new URL(href, here);
      } catch {
        failures.push(`${entry.file} bad href ${href}`);
        continue;
      }
      if (url.protocol === "mailto:" || url.protocol === "tel:" || url.protocol === "javascript:") continue;
      if (url.origin !== here.origin) continue;
      const id = decodeURIComponent(url.hash.replace(/^#/, ""));
      if (id && url.pathname === here.pathname) {
        const count = await page.locator(`[id="${id.replace(/"/g, '\\"')}"]`).count();
        if (count === 0) failures.push(`${entry.file} missing #${id}`);
      }
      const key = `${url.origin}${url.pathname}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const asset = await request.get(key);
      if (asset.status() >= 400) failures.push(`${key} ${asset.status()}`);
      if (id && url.pathname !== here.pathname) {
        const text = await asset.text();
        if (!text.includes(`id="${id}"`)) failures.push(`${key} missing #${id}`);
      }
    }
  }
  expect(failures).toEqual([]);
});
