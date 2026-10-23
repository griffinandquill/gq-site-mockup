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
  expect(shop).toContain(`src="js/form-config.js?v=${version}"`);
  expect(shop).not.toContain("products.js");
  expect(fs.existsSync(path.join(ROOT, "_site", "package.json"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "verify"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "tests"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "README.md"))).toBe(false);
});

test("robots.txt allows crawling and names the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe(copy.robots);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const body = await sitemap.text();
  for (const entry of pages) {
    if (entry.file === "404.html") {
      expect(body).not.toContain("404.html");
      continue;
    }
    const loc =
      entry.file === "index.html"
        ? "https://www.griffinandquill.com/"
        : `https://www.griffinandquill.com/${entry.file}`;
    expect(body).toContain(`<loc>${loc}</loc>`);
  }
  const icon = await request.get("/favicon.ico");
  expect(icon.status()).toBe(200);
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
      await expect(page.locator(".mockup-bar")).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", copy.ogImage);
      await expect(page.locator('meta[property="og:description"]')).not.toHaveAttribute("content", "");
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toBe(ogUrl);
      expect(ogUrl).toMatch(/^https:\/\/www\.griffinandquill\.com\//);
      if (entry.file === "privacy.html" || entry.file === "terms.html") {
        await expect(page.locator(".legal-banner")).toHaveText(copy.legalBanner);
      }
      if (entry.file === "index.html") {
        await expect(page.getByText("Quotes we hope to earn")).toHaveCount(0);
        await expect(page.getByText("after Ryan has permission")).toHaveCount(0);
      }
      if (entry.file === "about.html") {
        await expect(page.getByText("each built by a practicing teacher around one habit")).toBeVisible();
        await expect(page.getByRole("heading", { name: "Vision" })).toBeVisible();
        await expect(page.getByText("To be added")).toHaveCount(0);
        await expect(page.getByText("A demo is still ahead")).toHaveCount(0);
      }
      if (entry.file === "tutoring.html") {
        await expect(page.locator('a[href*="stripe.com"]')).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Book on Wyzant" }).first()).toHaveAttribute(
          "href",
          "https://www.wyzant.com/match/tutor/90199286",
        );
        await expect(page.getByRole("link", { name: "contact page" })).toHaveAttribute("href", "contact.html");
      }
      if (entry.file === "worlds.html") {
        await expect(page.getByText("Library: Professor Bramble keeps the books.")).toBeVisible();
        await expect(page.getByText("still reserved")).toHaveCount(0);
      }
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
  await page.locator(".brand").click();
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
    const posts: { url: string; body: Record<string, string> }[] = [];
    await page.route("https://formsubmit.co/**", async (route) => {
      posts.push({
        url: route.request().url(),
        body: route.request().postDataJSON() as Record<string, string>,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: "true" }),
      });
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(form.page);
    const region = page.locator(form.section);
    const thanks = region.locator("[data-thanks]");
    await expect(region.locator(`form[data-form="${form.route}"]`)).toBeVisible();
    await expect(region.locator("[name='_honey']")).toHaveCount(1);
    await expect(thanks).toBeHidden();
    await region.getByRole("button", { name: form.submit, exact: true }).click();
    await expect(thanks).toBeHidden();
    expect(posts).toEqual([]);
    for (const field of form.fields) await fillField(region, field);
    const before = page.url();
    await region.getByRole("button", { name: form.submit, exact: true }).click();
    await expect(thanks).toBeVisible();
    await expect(thanks).toHaveText(copy.thanks);
    await expect(thanks).toBeFocused();
    await expect(region.locator("[data-form-error]")).toBeHidden();
    expect(page.url()).toBe(before);
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toContain(encodeURIComponent(form.inbox));
    expect(posts[0].body._honey).toBeUndefined();
    if (form.id === "contact") {
      await page.screenshot({ path: "verify-results/form-thanks.png" });
    }
    expect(unexpected(errors, false)).toEqual([]);
  });
}

test("a failed send does not show thanks", async ({ page }) => {
  await page.route("https://formsubmit.co/**", async (route) => {
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({ success: false }),
    });
  });
  await page.goto("/contact.html");
  const region = page.locator("#contact-form");
  const contact = forms.find((form) => form.id === "contact");
  if (!contact) throw new Error("missing contact form");
  for (const field of contact.fields) await fillField(region, field);
  await region.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(region.locator("[data-thanks]")).toBeHidden();
  await expect(region.locator("[data-form-error]")).toBeVisible();
  await expect(region.locator("[data-form-error]")).toBeFocused();
});

test("a filled honeypot does not send", async ({ page }) => {
  let posts = 0;
  await page.route("https://formsubmit.co/**", async (route) => {
    posts += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: "true" }),
    });
  });
  await page.goto("/contact.html");
  const region = page.locator("#contact-form");
  const contact = forms.find((form) => form.id === "contact");
  if (!contact) throw new Error("missing contact form");
  for (const field of contact.fields) await fillField(region, field);
  await region.locator("[name='_honey']").fill("spam", { force: true });
  await region.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(region.locator("[data-thanks]")).toBeHidden();
  await expect(region.locator("[data-form-error]")).toBeHidden();
  expect(posts).toBe(0);
});

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

test("the curriculum page says materials are coming soon and offers a newsletter", async ({ page }) => {
  await page.goto("/resources.html");
  await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
  await expect(page.locator("#shop-news form[data-form='hello']")).toBeVisible();
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.getByText("The Road to Revolution")).toHaveCount(0);
  await expect(page.getByText("Teachers Pay Teachers")).toHaveCount(0);
});

const sceneNpcs = [
  { name: "Bramble", selector: ".qh-bramble", sheet: "bramble-idle.png" },
  { name: "Merlin", selector: ".qh-merlin", sheet: "merlin-idle.png" },
  { name: "Tahne", selector: ".qh-tahne", sheet: "tahne-idle.png" },
  { name: "Winston", selector: ".qh-winston", sheet: "winston-idle.png" },
  { name: "Brittany", selector: ".qh-brittany", sheet: "brittany-idle.png" },
  { name: "Ruth", selector: ".qh-ruth", sheet: "ruth-idle.png" },
  { name: "Rudy", selector: ".qh-rudy", sheet: "rudy-idle.png" },
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
      const minSprite = width >= 1000 ? 20 : 6;
      expect(box.width, `${npc.name} width at ${width}`).toBeGreaterThan(minSprite);
      expect(box.height, `${npc.name} height at ${width}`).toBeGreaterThan(minSprite);
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

const castWho = ["bramble", "brittany", "ruth", "winston", "merlin", "tahne", "rudy"];

async function waitForCast(page: Page) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = await page.evaluate(() => document.documentElement.dataset.castReady || document.documentElement.dataset.castError || "");
    if (state === "1") return;
    if (state) throw new Error(state);
    await page.clock.fastForward(50);
  }
  throw new Error("cast did not start");
}

async function expectCastInCrop(page: Page, clip: string, root: string, label: string) {
  const rows = await page.evaluate(({ clip, root }) => {
    const boxEl = document.querySelector(clip);
    if (!boxEl) return [];
    const box = boxEl.getBoundingClientRect();
    const boxStyle = getComputedStyle(boxEl);
    const cropLeft = box.left + (parseFloat(boxStyle.borderLeftWidth) || 0);
    const cropTop = box.top + (parseFloat(boxStyle.borderTopWidth) || 0);
    return Array.from(document.querySelectorAll(`${root} [data-sprite]`)).map((sprite) => {
      const actor = sprite.closest("[data-who]");
      const rect = sprite.getBoundingClientRect();
      const style = getComputedStyle(sprite);
      return {
        who: actor ? actor.getAttribute("data-who") : "",
        opacity: style.opacity,
        visibility: style.visibility,
        display: style.display,
        image: style.backgroundImage,
        width: rect.width,
        height: rect.height,
        left: rect.left - cropLeft,
        right: rect.right - cropLeft,
        top: rect.top - cropTop,
        bottom: rect.bottom - cropTop,
        boxW: boxEl.clientWidth,
        boxH: boxEl.clientHeight,
      };
    });
  }, { clip, root });
  expect(rows.map((row) => row.who).sort(), label).toEqual([...castWho].sort());
  for (const row of rows) {
    expect(row.opacity, `${label} ${row.who}`).toBe("1");
    expect(row.visibility, `${label} ${row.who}`).toBe("visible");
    expect(row.display, `${label} ${row.who}`).not.toBe("none");
    expect(row.image, `${label} ${row.who}`).not.toBe("none");
    expect(row.width, `${label} ${row.who}`).toBeGreaterThan(4);
    expect(row.height, `${label} ${row.who}`).toBeGreaterThan(4);
    expect(row.left, `${label} ${row.who} left`).toBeGreaterThanOrEqual(-1);
    expect(row.top, `${label} ${row.who} top`).toBeGreaterThanOrEqual(-1);
    expect(row.right, `${label} ${row.who} right`).toBeLessThanOrEqual(row.boxW + 1);
    expect(row.bottom, `${label} ${row.who} bottom`).toBeLessThanOrEqual(row.boxH + 1);
  }
}

test.describe("quillhaven cast stays on screen", () => {
  test.use({ reducedMotion: "no-preference" });

  test("all seven characters stay visible and in bounds over several minutes", async ({ page }) => {
    test.setTimeout(90_000);
    await page.clock.install();

    async function expectCast(clip: string, root: string, label: string) {
      await expectCastInCrop(page, clip, root, label);
    }

    async function heroXs() {
      return page.evaluate(() => Array.from(document.querySelectorAll(".qh-scene .qh-actor")).map((actor) => {
        const el = actor as HTMLElement;
        return el.style.getPropertyValue("--x");
      }).join(","));
    }

    const runs = [
      { width: 1280, height: 720, seconds: 180, poster: true },
      { width: 1366, height: 768, seconds: 40, poster: false },
      { width: 1440, height: 900, seconds: 180, poster: true },
      { width: 1536, height: 864, seconds: 40, poster: false },
      { width: 1920, height: 1080, seconds: 40, poster: false },
      { width: 1024, height: 576, seconds: 40, poster: false },
      { width: 960, height: 540, seconds: 40, poster: true },
      { width: 853, height: 480, seconds: 180, poster: true },
      { width: 768, height: 900, seconds: 40, poster: false },
      { width: 390, height: 844, seconds: 40, poster: true },
    ];
    for (const run of runs) {
      await page.setViewportSize({ width: run.width, height: run.height });
      await page.goto(`/worlds.html?cast=${run.width}x${run.height}`);
      await expect(page.locator(".qh-scene")).toBeVisible();
      await waitForCast(page);
      await page.clock.fastForward(400);
      const step = run.seconds > 40 ? 5 : 10;
      for (let sec = 0; sec <= run.seconds; sec += step) {
        if (sec) await page.clock.fastForward(step * 1000);
        if (sec === 60) await page.clock.fastForward(10 * 60 * 1000);
        await expectCast(".qh-scene", ".qh-scene", `hero ${run.width}x${run.height} t=${sec}`);
      }
      if (!run.poster) continue;
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        const play = document.querySelector("#play");
        if (!play) return;
        const top = play.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, Math.max(0, top - 80));
      });
      await page.clock.fastForward(400);
      for (let sec = 0; sec <= 40; sec += 10) {
        if (sec) await page.clock.fastForward(10_000);
        await expectCast(".play-fit", ".play-panorama", `poster ${run.width}px t=${sec}`);
      }
    }

    async function resizeTo(width: number, height: number) {
      await page.setViewportSize({ width, height });
      // The test clock can hold the browser's own resize event. Dispatch the one the scene listens for.
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/worlds.html?cast=resize");
    await waitForCast(page);
    await page.clock.fastForward(400);
    for (let step = 0; step < 20; step += 1) {
      const rudy = await page.evaluate(() => {
        const style = document.querySelector('.qh-scene [data-who="rudy"]')?.getAttribute("style") || "";
        const match = /--x:\s*([0-9.]+)/.exec(style);
        return match ? Number(match[1]) : 0;
      });
      if (rudy >= 545) break;
      await page.clock.fastForward(2000);
    }
    for (const width of [1440, 1366, 1280, 1100, 1024, 960, 853, 768, 1440, 1920, 1536]) {
      await resizeTo(width, 800);
      await expectCast(".qh-scene", ".qh-scene", `resized to ${width}`);
    }
    await resizeTo(853, 700);
    await page.goto("/worlds.html?cast=grow");
    await waitForCast(page);
    await page.clock.fastForward(17_000);
    await expectCast(".qh-scene", ".qh-scene", "opened at 150% zoom");
    await resizeTo(1440, 900);
    await expectCast(".qh-scene", ".qh-scene", "grown from zoom to laptop");

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/worlds.html?cast=resume");
    await waitForCast(page);
    await page.clock.fastForward(400);
    await page.evaluate(() => {
      Object.defineProperty(Document.prototype, "hidden", {
        configurable: true,
        get() { return (document as Document & { __hide?: boolean }).__hide === true; },
      });
      (document as Document & { __hide?: boolean }).__hide = true;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const whileHidden = await heroXs();
    await page.clock.fastForward(8000);
    expect(await heroXs()).toBe(whileHidden);
    await page.evaluate(() => {
      (document as Document & { __hide?: boolean }).__hide = false;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.clock.fastForward(4000);
    expect(await heroXs()).not.toBe(whileHidden);
    await expectCast(".qh-scene", ".qh-scene", "hero after tab show");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const whileAway = await heroXs();
    await page.clock.fastForward(5000);
    expect(await heroXs()).toBe(whileAway);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.clock.fastForward(4000);
    expect(await heroXs()).not.toBe(whileAway);
    await expectCast(".qh-scene", ".qh-scene", "hero after scroll back");
  });

  test("each sprite stays on a drawn frame for a full cast loop", async ({ page }) => {
    test.setTimeout(180_000);
    const width = 1440;
    const height = 900;
    const seconds = 40;
    await page.setViewportSize({ width, height });
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/worlds.html?frames=cast");
    await page.waitForFunction(() => {
      const root = document.documentElement;
      return root.dataset.castReady === "1" || root.dataset.castError;
    });
    const castError = await page.evaluate(() => document.documentElement.dataset.castError || "");
    expect(castError).toBe("");
    await page.evaluate(() => {
      document.querySelectorAll(".qh-lamp, .qh-fly, .qh-cloud, .qh-window, .accent-flight").forEach((node) => {
        (node as HTMLElement).style.animation = "none";
      });
      const bird = document.querySelector(".accent-flight");
      if (bird) (bird as HTMLElement).style.visibility = "hidden";
    });

    const client = await page.context().newCDPSession(page);
    const shots: { png: Buffer; stamp: number }[] = [];
    client.on("Page.screencastFrame", (event) => {
      const metadata = event.metadata as { timestamp?: number } | undefined;
      const raw = metadata && typeof metadata.timestamp === "number" ? metadata.timestamp : 0;
      const stamp = raw > 1e12 ? raw : raw > 1e9 ? raw * 1000 : Date.now();
      shots.push({ png: Buffer.from(event.data, "base64"), stamp });
      void client.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
    });

    await page.evaluate(() => {
      document.querySelectorAll(".qh-scene [data-sprite]").forEach((node) => {
        (node as HTMLElement).style.visibility = "hidden";
      });
    });
    await client.send("Page.startScreencast", { format: "png", everyFrame: true });
    await expect.poll(() => shots.length, { timeout: 5_000 }).toBeGreaterThan(1);
    const reference = decodePng(shots[shots.length - 1].png);
    await client.send("Page.stopScreencast");
    await page.waitForTimeout(150);
    shots.length = 0;

    await page.evaluate(() => {
      document.querySelectorAll(".qh-scene [data-sprite]").forEach((node) => {
        (node as HTMLElement).style.visibility = "";
      });
      const samples: CastFrame[] = [];
      (window as Window & { __castFrames?: CastFrame[] }).__castFrames = samples;
      const log = () => {
        samples.push({
          t: Date.now(),
          rows: Array.from(document.querySelectorAll(".qh-scene [data-sprite]")).map((sprite) => {
            const actor = sprite.closest("[data-who]");
            const rect = sprite.getBoundingClientRect();
            const style = getComputedStyle(sprite);
            const sheet = parseFloat(style.backgroundSize) || 0;
            const pos = parseFloat(style.backgroundPositionX) || 0;
            const cell = (parseFloat(style.getPropertyValue("--cell-w")) || 0) * 2;
            return {
              who: actor ? actor.getAttribute("data-who") || "" : "",
              pose: sprite.getAttribute("data-pose") || "",
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              sheet,
              pos,
              cell,
              image: style.backgroundImage.startsWith('url("data:image/png') ? "strip" : style.backgroundImage.slice(0, 48),
            };
          }),
        });
        window.requestAnimationFrame(log);
      };
      window.requestAnimationFrame(log);
    });
    shots.length = 0;
    const captureStart = Date.now();
    await client.send("Page.startScreencast", { format: "png", everyFrame: true });

    await page.waitForTimeout(seconds * 1000);
    await client.send("Page.stopScreencast");
    await page.waitForTimeout(200);
    const samples = await page.evaluate(() => {
      const holder = window as Window & { __castFrames?: CastFrame[] };
      return holder.__castFrames || [];
    });
    const seen = new Map<string, Set<string>>();
    const styleProblems: string[] = [];
    for (const sample of samples) {
      for (const row of sample.rows) {
        const poses = seen.get(row.who) || new Set<string>();
        poses.add(row.pose);
        seen.set(row.who, poses);
        if (row.image !== "strip") styleProblems.push(`${row.who} sheet ${row.image}`);
        if (row.width <= 4 || row.height <= 4) styleProblems.push(`${row.who} box ${row.width}x${row.height}`);
        if (!(row.cell > 0)) styleProblems.push(`${row.who} cell`);
        if (row.pos > 0.5 || -row.pos >= row.sheet - row.cell + 1) styleProblems.push(`${row.who} pos ${row.pos}`);
      }
    }
    expect(styleProblems.slice(0, 8)).toEqual([]);
    expect(samples.length, "animation samples").toBeGreaterThan(seconds * 20);

    let frames = 0;
    let worstGap = 0;
    let worst = { who: "", diff: Number.POSITIVE_INFINITY, pose: "" };
    const blanks: string[] = [];
    const captured = shots.splice(0, shots.length);
    let primed = false;
    for (const shot of captured) {
      if (shot.stamp < captureStart - 30) continue;
      const decoded = decodePng(shot.png);
      if (decoded.width !== reference.width || decoded.height !== reference.height) {
        styleProblems.push(`frame ${decoded.width}x${decoded.height}`);
        break;
      }
      const sample = nearestCastFrame(samples, shot.stamp);
      const gap = Math.abs(sample.t - shot.stamp);
      if (gap > worstGap) worstGap = gap;
      if (!primed) {
        const painted = sample.rows.some(
          (row) => meanChannelDiff(reference, decoded, row, width, height) >= 10,
        );
        if (!painted) continue;
        primed = true;
      }
      frames += 1;
      for (const row of sample.rows) {
        const diff = meanChannelDiff(reference, decoded, row, width, height);
        if (diff < worst.diff) worst = { who: row.who, diff, pose: row.pose };
        if (diff < 10) {
          const name = `${row.who}-${row.pose}-${frames}`;
          blanks.push(`${name} diff ${diff.toFixed(2)}`);
          if (blanks.length <= 4) {
            fs.mkdirSync("verify-results", { recursive: true });
            fs.writeFileSync(path.join("verify-results", `blank-${name}.png`), shot.png);
          }
        }
      }
    }
    expect(worstGap, "frame clock").toBeLessThan(80);
    expect(styleProblems.slice(0, 8)).toEqual([]);

    expect(pageErrors).toEqual([]);
    expect(frames, "compositor frames").toBeGreaterThan(seconds * 20);
    for (const who of castWho) {
      expect(seen.get(who)?.has("walk"), `${who} walked`).toBe(true);
      expect(seen.get(who)?.has("idle"), `${who} idled`).toBe(true);
    }
    expect(blanks, `empty sprite frames (lowest diff ${worst.who} ${worst.pose} ${worst.diff.toFixed(2)})`).toEqual([]);
  });
});

type PngImage = { width: number; height: number; channels: number; pixels: Buffer };

function decodePng(png: Buffer): PngImage {
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
    if (filter === 0) {
      inflated.copy(pixels, rowStart, src, src + rowSize);
      src += rowSize;
      continue;
    }
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
  return { width, height, channels, pixels };
}

type CastFrame = {
  t: number;
  rows: {
    who: string;
    pose: string;
    left: number;
    top: number;
    width: number;
    height: number;
    sheet: number;
    pos: number;
    cell: number;
    image: string;
  }[];
};

function nearestCastFrame(samples: CastFrame[], stamp: number) {
  let low = 0;
  let high = samples.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (samples[mid].t < stamp) low = mid + 1;
    else high = mid;
  }
  const next = samples[low];
  const prev = samples[Math.max(0, low - 1)];
  return Math.abs(prev.t - stamp) <= Math.abs(next.t - stamp) ? prev : next;
}

function meanChannelDiff(
  reference: PngImage,
  frame: PngImage,
  rect: { left: number; top: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
) {
  const scaleX = frame.width / viewportWidth;
  const scaleY = frame.height / viewportHeight;
  const x0 = Math.max(0, Math.floor(rect.left * scaleX));
  const y0 = Math.max(0, Math.floor(rect.top * scaleY));
  const x1 = Math.min(frame.width, Math.ceil((rect.left + rect.width) * scaleX));
  const y1 = Math.min(frame.height, Math.ceil((rect.top + rect.height) * scaleY));
  let sum = 0;
  let count = 0;
  const channels = frame.channels;
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const frameAt = (y * frame.width + x) * channels;
      const refAt = (y * reference.width + x) * reference.channels;
      sum += Math.abs(frame.pixels[frameAt] - reference.pixels[refAt]);
      sum += Math.abs(frame.pixels[frameAt + 1] - reference.pixels[refAt + 1]);
      sum += Math.abs(frame.pixels[frameAt + 2] - reference.pixels[refAt + 2]);
      count += 3;
    }
  }
  return count ? sum / count : 0;
}

for (const dpr of [1.25, 1.5, 2]) {
  test.describe(`quillhaven cast at devicePixelRatio ${dpr}`, () => {
    test.use({
      reducedMotion: "no-preference",
      deviceScaleFactor: dpr,
      viewport: { width: 1440, height: 900 },
    });

    test(`all seven stay inside the crop at pixel ratio ${dpr}`, async ({ page }) => {
      await page.clock.install();
      await page.goto(`/worlds.html?dpr=${dpr}`);
      await waitForCast(page);
      await page.clock.fastForward(17_000);
      await expectCastInCrop(page, ".qh-scene", ".qh-scene", `dpr ${dpr} laptop`);
      await page.setViewportSize({ width: 853, height: 480 });
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await expectCastInCrop(page, ".qh-scene", ".qh-scene", `dpr ${dpr} zoom`);
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await expectCastInCrop(page, ".qh-scene", ".qh-scene", `dpr ${dpr} restored`);
    });
  });
}

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
  for (const width of [1280, 768, 390, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`/worlds.html?view=${width}#play`);
    const stage = page.locator("[data-play-stage]");
    await expect(stage).toBeVisible();
    await expect(stage.locator("iframe")).toHaveCount(0);
    const layout = await stage.evaluate((el) => {
      const stageBox = el.getBoundingClientRect();
      const button = el.querySelector(".play-poster .btn");
      if (!button) throw new Error("missing play button");
      const btn = button.getBoundingClientRect();
      const npcs = Array.from(el.querySelectorAll(".play-panorama .qh-npc")).map((node) => {
        const box = node.getBoundingClientRect();
        return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
      });
      return {
        stage: { top: stageBox.top, right: stageBox.right, bottom: stageBox.bottom, left: stageBox.left, height: stageBox.height },
        btn: { top: btn.top, right: btn.right, bottom: btn.bottom, left: btn.left },
        npcs,
      };
    });
    expect(layout.npcs, `poster cast at ${width}`).toHaveLength(7);
    expect(layout.btn.top - layout.stage.top, `play button top at ${width}`).toBeLessThan(layout.stage.height * 0.22);
    expect(layout.btn.bottom, `play button stays high at ${width}`).toBeLessThan(layout.stage.top + layout.stage.height * 0.45);
    for (const npc of layout.npcs) {
      expect(npc.height, `poster sprite height at ${width}`).toBeGreaterThan(10);
      expect(npc.top, `poster sprite top at ${width}`).toBeGreaterThanOrEqual(layout.stage.top - 1);
      expect(npc.bottom, `poster sprite bottom at ${width}`).toBeLessThanOrEqual(layout.stage.bottom + 1);
      expect(npc.left, `poster sprite left at ${width}`).toBeGreaterThanOrEqual(layout.stage.left - 1);
      expect(npc.right, `poster sprite right at ${width}`).toBeLessThanOrEqual(layout.stage.right + 1);
      const overlaps = npc.left < layout.btn.right && npc.right > layout.btn.left && npc.top < layout.btn.bottom && npc.bottom > layout.btn.top;
      expect(overlaps, `play button covers a character at ${width}`).toBe(false);
    }
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
  await expect(page).toHaveTitle("Griffin & Quill | Where learning becomes an adventure");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page is not on the site.");
  await expect(page.locator(".mockup-bar")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
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
