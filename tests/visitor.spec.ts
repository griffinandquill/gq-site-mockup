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
  const store = fs.readFileSync(path.join(ROOT, "_site", "store.html"), "utf8");
  const legacy = fs.readFileSync(path.join(ROOT, "_site", "resources.html"), "utf8");
  const home = fs.readFileSync(path.join(ROOT, "_site", "index.html"), "utf8");
  expect(worlds).toContain(`href="css/styles.css?v=${version}"`);
  expect(worlds).toContain(`src="js/main.js?v=${version}"`);
  expect(worlds).not.toContain("tahne.png");
  expect(worlds).not.toContain("hero-scene.js");
  expect(worlds).not.toContain("town-square.js");
  expect(home).toContain("assets/worktable.jpg");
  expect(home).toContain(`src="js/chart.js?v=${version}"`);
  expect(home).not.toContain("logo-icon.svg");
  expect(store).toContain(`src="js/store.js?v=${version}"`);
  expect(store).toContain(`href="data/store.json?v=${version}"`);
  expect(store).not.toContain("products.js");
  expect(legacy).toContain("store.html");
  expect(legacy).not.toContain("products.js");
  expect(fs.existsSync(path.join(ROOT, "_site", "package.json"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "verify"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "tests"))).toBe(false);
  expect(fs.existsSync(path.join(ROOT, "_site", "README.md"))).toBe(false);
});

test("visitor icons use the text monogram", () => {
  const svg = fs.readFileSync(path.join(ROOT, "favicon.svg"), "utf8");
  expect(svg).toContain("G&amp;Q");
  expect(svg).not.toContain("Layer_1");
  expect(svg.toLowerCase()).not.toContain("gryphon");
  const manifest = fs.readFileSync(path.join(ROOT, "assets/icons/site.webmanifest"), "utf8");
  expect(manifest).toContain("/assets/icons/favicon-32.png");
  expect(manifest).toContain("/assets/icons/apple-touch-icon-180.png");
  expect(manifest).not.toContain("logo-icon");
  expect(manifest).not.toContain("tahne");
  for (const rel of ["assets/og.png", "assets/icons/favicon-32.png", "assets/icons/apple-touch-icon-180.png"]) {
    const png = fs.readFileSync(path.join(ROOT, rel));
    expect(png.subarray(0, 8).toString("hex"), rel).toBe("89504e470d0a1a0a");
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width, rel).toBeGreaterThan(0);
    expect(height, rel).toBeGreaterThan(0);
  }
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
    if (entry.redirectsTo) {
      expect(body).not.toContain(`<loc>https://www.griffinandquill.com/${entry.file}</loc>`);
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
      if (entry.redirectsTo) {
        await expect(page).toHaveURL(new RegExp(`${entry.redirectsTo.replace(/\./g, "\\.")}$`));
      }
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
        await expect(page.getByRole("link", { name: "Book tutoring", exact: true })).toHaveAttribute(
          "href",
          "tutoring.html#book",
        );
      }
      if (entry.file === "contact.html") {
        await expect(page.getByRole("link", { name: "Book with us", exact: true })).toHaveAttribute(
          "href",
          "tutoring.html#book",
        );
      }
      if (entry.file === "faq.html") {
        const price = page.locator("details.faq").filter({ hasText: "How much does tutoring cost?" });
        await price.locator("summary").click();
        await expect(price.getByRole("link", { name: "Book with Griffin & Quill" })).toHaveAttribute(
          "href",
          "tutoring.html#book",
        );
      }
      if (entry.file === "about.html") {
        await expect(page.getByText("each built by a practicing teacher around one habit")).toBeVisible();
        await expect(page.getByRole("heading", { name: "Vision" })).toBeVisible();
        await expect(page.getByText("To be added")).toHaveCount(0);
        await expect(page.getByText("A demo is still ahead")).toHaveCount(0);
      }
      if (entry.file === "tutoring.html") {
        await expect(page.locator('a[href*="stripe.com"]')).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Book with us", exact: true })).toHaveAttribute("href", "#book");
        await expect(page.locator(".page-hero a[href*='wyzant.com']")).toHaveCount(0);
        await expect(page.locator("#book a.btn")).toHaveCount(0);
        const wyzant = page.getByRole("link", { name: "Already on Wyzant? Book there." });
        await expect(wyzant).toHaveCount(1);
        await expect(wyzant).toHaveAttribute("href", "https://www.wyzant.com/match/tutor/90199286");
        await expect(wyzant).not.toHaveClass(/btn/);
        const bookOrder = await page.locator("#book").evaluate((section) => {
          const form = section.querySelector("form");
          const link = section.querySelector("a[href*='wyzant.com']");
          if (!form || !link) return "missing";
          const position = form.compareDocumentPosition(link);
          const afterForm = (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
          const before = section.innerHTML.slice(0, section.innerHTML.indexOf("<form")).toLowerCase();
          const outsideForm = !form.contains(link);
          return afterForm && outsideForm && !before.includes("wyzant") ? "form-first" : "wyzant-first";
        });
        expect(bookOrder).toBe("form-first");
        await expect(page.locator("#book form[data-form='tutoring']")).toBeVisible();
        await expect(page.getByText("This site does not take payment.").first()).toBeVisible();
      }
      if (entry.file === "worlds.html") {
        await expect(page.getByText("A demo is planned for December 2, 2026.")).toBeVisible();
        await expect(page.getByText("TypeScript and Phaser 4")).toBeVisible();
        await expect(page.getByText("still reserved")).toHaveCount(0);
        await expect(page.getByText("Gryff")).toHaveCount(0);
        await expect(page.getByText("Tahne")).toHaveCount(0);
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
    if (form.id === "tutoring") {
      expect(posts[0].url).toBe("https://formsubmit.co/ajax/tutoring%40griffinandquill.com");
      expect(posts[0].body).toEqual({
        parent_name: "Ada Lovelace",
        email: "qa@example.com",
        phone: "843-555-0100",
        grade: "Grade 9",
        subject: "History and social studies",
        meeting: "Online",
        preferred_times: "Weekday evenings",
        message: "Layout check for the tutoring form.",
        _subject: "New tutoring booking request",
        _captcha: "false",
      });
    }
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

test("the old curriculum address opens the store", async ({ page }) => {
  const response = await page.goto("/resources.html");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/store\.html$/);
  await expect(page.getByRole("heading", { level: 1, name: "Classroom units and simulations." })).toBeVisible();
  await expect(page.locator("#site-nav").getByRole("link", { name: "Curriculum", exact: true })).toHaveCount(0);
  await expect(page.locator('#site-nav a[aria-current="page"]')).toHaveText("Store");
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.getByText("The Road to Revolution")).toHaveCount(0);
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

test("the header uses the wordmark and the home chart is a sample", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto("/index.html");
  await expect(page.locator(".brand .logo")).toHaveCount(0);
  await expect(page.locator(".logo-hero")).toHaveCount(0);
  await expect(page.locator(".brand")).toContainText("Griffin & Quill");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Write your");
  await expect(page.locator(".legend-tag")).toContainText("Learn it. Live it.");
  await expect(page.locator(".legend-tag")).toContainText("PROVE IT!");
  await expect(page.locator(".worktable-art")).toHaveAttribute("alt", "");
  await expect(page.getByText("Gryff")).toHaveCount(0);
  await expect(page.getByText("Tahne")).toHaveCount(0);
  const story = page.locator("#chart-story");
  await expect(page.getByText("Sample interaction")).toBeVisible();
  await expect(story).toContainText("The key says a dashed line marks a ford");
  await expect(page.locator("#chart-skill")).toHaveText("Skill: using map evidence to make an inference");
  await page.getByRole("button", { name: "Choose: cross at the ford" }).click();
  await expect(story).toContainText("so the key was right");
  await expect(page.locator(".chart-route.is-chosen")).toHaveCount(1);
  await page.getByRole("button", { name: "Choose: take the close-lined trail" }).click();
  await expect(story).toContainText("Inference checked: close lines, steep slope.");
  await expect(page.locator(".chart-route.is-chosen")).toHaveCount(2);
  await page.getByRole("button", { name: "Reset the chart" }).click();
  await expect(story).toContainText("The key says a dashed line marks a ford");
  await expect(page.getByRole("button", { name: "Choose: climb the tower first" })).toBeVisible();
  await page.getByRole("button", { name: "Choose: climb the tower first" }).focus();
  await page.keyboard.press("Enter");
  await expect(story).toContainText("From the top you compare the chart to the land");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(story).toContainText("the inference held");
});

test("every chart choice stays inside the stage", async ({ page }) => {
  const routes = [
    { clicks: [] as string[], names: ["Choose: cross at the ford", "Choose: climb the tower first"] },
    { clicks: ["Choose: cross at the ford"], names: ["Choose: take the close-lined trail", "Choose: take the wide-lined trail"] },
    { clicks: ["Choose: cross at the ford", "Choose: take the close-lined trail"], names: [] },
    { clicks: ["Choose: cross at the ford", "Choose: take the wide-lined trail"], names: [] },
    { clicks: ["Choose: climb the tower first"], names: ["Choose: note the clue on the chart", "Choose: climb down and cross"] },
    { clicks: ["Choose: climb the tower first", "Choose: note the clue on the chart"], names: [] },
    { clicks: ["Choose: climb the tower first", "Choose: climb down and cross"], names: [] },
  ];
  for (const width of [1366, 768, 481, 375]) {
    await page.setViewportSize({ width, height: width === 1366 ? 768 : 900 });
    for (const route of routes) {
      const label = `${width} ${route.clicks.join(" > ") || "start"}`;
      await page.goto(`/index.html?chart=${encodeURIComponent(label)}`);
      for (const name of route.clicks) {
        await page.getByRole("button", { name, exact: true }).click();
      }
      await expect(page.locator(".chart-choice"), label).toHaveCount(route.names.length);
      const fit = await page.evaluate(() => {
        const stage = document.getElementById("chart-stage");
        if (!stage) return null;
        const stageBox = stage.getBoundingClientRect();
        const view = document.documentElement.clientWidth;
        return {
          overflow: document.documentElement.scrollWidth - view,
          view,
          buttons: Array.from(document.querySelectorAll(".chart-choice")).map((button) => {
            const box = button.getBoundingClientRect();
            return {
              name: (button.textContent || "").trim(),
              left: box.left,
              right: box.right,
              top: box.top,
              bottom: box.bottom,
              stageLeft: stageBox.left,
              stageRight: stageBox.right,
              stageTop: stageBox.top,
              stageBottom: stageBox.bottom,
            };
          }),
        };
      });
      if (!fit) throw new Error(`missing chart at ${label}`);
      expect(fit.overflow, `${label} overflow`).toBeLessThanOrEqual(1);
      expect(fit.buttons.map((button) => button.name), label).toEqual(route.names);
      for (const button of fit.buttons) {
        expect(button.left, `${label} ${button.name} left`).toBeGreaterThanOrEqual(button.stageLeft - 0.5);
        expect(button.right, `${label} ${button.name} right`).toBeLessThanOrEqual(button.stageRight + 0.5);
        expect(button.top, `${label} ${button.name} top`).toBeGreaterThanOrEqual(button.stageTop - 0.5);
        expect(button.bottom, `${label} ${button.name} bottom`).toBeLessThanOrEqual(button.stageBottom + 0.5);
        expect(button.right, `${label} ${button.name} viewport`).toBeLessThanOrEqual(fit.view + 0.5);
        expect(button.left, `${label} ${button.name} viewport left`).toBeGreaterThanOrEqual(-0.5);
      }
    }
  }
});

test.describe("sample chart on a touch screen", () => {
  test.use({ hasTouch: true });

  test("the sample chart accepts a tap and stays inside the viewport", async ({ page }) => {
  for (const width of [1366, 768, 481, 375]) {
    await page.setViewportSize({ width, height: width === 1366 ? 768 : 900 });
    await page.goto(`/index.html?width=${width}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `home overflow at ${width}`).toBeLessThanOrEqual(1);
    const choice = page.getByRole("button", { name: "Choose: climb the tower first" });
    await choice.scrollIntoViewIfNeeded();
    const box = await choice.boundingBox();
    if (!box) throw new Error(`missing choice at ${width}`);
    expect(box.width, `choice width at ${width}`).toBeGreaterThanOrEqual(44);
    expect(box.height, `choice height at ${width}`).toBeGreaterThanOrEqual(40);
    await choice.tap();
    await expect(page.locator("#chart-story")).toContainText("From the top you compare the chart to the land");
    await page.goto(`/worlds.html?width=${width}`);
    const worldsOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(worldsOverflow, `quillhaven overflow at ${width}`).toBeLessThanOrEqual(1);
  }
  });
});

test("the home page has no flying gryphon", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator(".accent-flight")).toHaveCount(0);
  await expect(page.locator(".accent-gryphon")).toHaveCount(0);
  await expect(page.locator(".is-flying")).toHaveCount(0);
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

test("the quillhaven page leads with value, uses status chips, and has no empty mark slot", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto("/worlds.html");
  await expect(page.locator(".mark-slot")).toHaveCount(0);
  await expect(page.getByText("Quillhaven mark")).toHaveCount(0);
  await expect(page.locator(".lib-lede")).toContainText("learning game for academic skills");
  await expect(page.locator("#forge .chip")).toHaveText(/Planned/);
  await expect(page.locator("#command-center .chip")).toHaveText(/Planned/);
  await expect(page.getByRole("heading", { name: "Privacy, by design" })).toHaveCount(1);
  await expect(page.getByText("never sent to an AI")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Join the demo waitlist" })).toHaveAttribute("href", "#waitlist");
  const sizes = await page.locator("main p, main li").evaluateAll((nodes) =>
    nodes
      .filter((node) => !node.classList.contains("chip") && !node.classList.contains("eyebrow") && !node.closest(".visually-hidden"))
      .map((node) => parseFloat(getComputedStyle(node).fontSize)),
  );
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
  const bg = await page.locator("main").evaluate((node) => getComputedStyle(node).backgroundColor);
  const [r, g, b] = (bg.match(/\d+/g) || []).map(Number);
  expect(r + g + b, "quillhaven main is a dark section").toBeLessThan(120);
});

test("the chart shows the whole faint map, anchors choices on stars, and stays local", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  for (const width of [1366, 768, 481, 375]) {
    await page.setViewportSize({ width, height: width === 1366 ? 768 : 900 });
    await page.goto(`/index.html?anchor=${width}`);
    await page.waitForLoadState("load");
    requests.length = 0;
    for (const step of [[], ["Choose: cross at the ford"], ["Choose: climb the tower first"]]) {
      await page.getByRole("button", { name: "Reset the chart" }).click();
      for (const name of step) await page.getByRole("button", { name, exact: true }).click();
      await expect(page.locator(".chart-route")).toHaveCount(6);
      await expect(page.locator(".chart-route.is-chosen")).toHaveCount(step.length);
      expect(await page.locator(".chart-web-star").count()).toBeGreaterThanOrEqual(40);
      const fit = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".chart-choice")).map((button) => {
          const star = document.querySelector(`.chart-node[data-node="${button.dataset.node}"]`);
          const b = button.getBoundingClientRect();
          const s = star ? star.getBoundingClientRect() : null;
          return {
            name: button.textContent,
            box: { left: b.left, right: b.right, top: b.top, bottom: b.bottom },
            star: s ? { x: s.left + s.width / 2, y: s.top + s.height / 2 } : null,
          };
        }),
      );
      for (const item of fit) {
        expect(item.star, `${width} ${item.name} has a star`).not.toBeNull();
        if (!item.star) continue;
        const dx = Math.max(item.box.left - item.star.x, 0, item.star.x - item.box.right);
        const dy = Math.max(item.box.top - item.star.y, 0, item.star.y - item.box.bottom);
        expect(Math.hypot(dx, dy), `${width} ${item.name} sits by its star`).toBeLessThanOrEqual(48);
      }
      if (fit.length === 2) {
        const [a, b] = fit.map((item) => item.box);
        const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        expect(overlap, `${width} choices overlap after ${step.join(" > ") || "start"}`).toBe(false);
      }
    }
    expect(requests, `chart use makes no requests at ${width}`).toEqual([]);
  }
  const stored = await page.evaluate(() => ({ cookie: document.cookie, local: localStorage.length, session: sessionStorage.length }));
  expect(stored).toEqual({ cookie: "", local: 0, session: 0 });
});

test("home actions name their destinations and the waitlist comes first", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.getByText("Start exploring")).toHaveCount(0);
  const actions = page.locator(".worktable-copy .hero-actions a");
  await expect(actions).toHaveCount(2);
  await expect(actions.nth(0)).toHaveText("Join the demo waitlist");
  await expect(actions.nth(0)).toHaveAttribute("href", "worlds.html#waitlist");
  await expect(actions.nth(0)).toHaveClass(/btn-gold/);
  await expect(actions.nth(1)).toHaveText("Try the sample chart");
  await expect(actions.nth(1)).toHaveAttribute("href", "#story-chart");
  await expect(page.locator(".hero-more a")).toHaveAttribute("href", "worlds.html");
  await expect(page.locator(".hero-more a")).toHaveText("Explore Quillhaven");
});

test("the stylesheet's braces balance and no rule block is left open", () => {
  const css = fs.readFileSync(path.join(ROOT, "css", "styles.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  let line = 1;
  let problem = "";
  for (const ch of css) {
    if (ch === "\n") line += 1;
    else if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    if (!problem && depth < 0) problem = `brace depth went negative near line ${line}`;
    if (!problem && depth > 2) problem = `rules nested more than two deep near line ${line}`;
  }
  expect(problem).toBe("");
  expect(depth, "an unclosed block in css/styles.css").toBe(0);
});

test("the tutoring planner updates the plan and fills only existing booking fields", async ({ page }) => {
  const posts: Record<string, string>[] = [];
  await page.route("https://formsubmit.co/**", async (route) => {
    posts.push(route.request().postDataJSON() as Record<string, string>);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: "true" }) });
  });
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  for (const width of [1366, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/tutoring.html?planner=${width}`);
    await page.waitForLoadState("load");
    requests.length = 0;
    await page.getByRole("radio", { name: /Economics/ }).check();
    await page.getByRole("radio", { name: /Test prep/ }).check();
    await page.getByRole("radio", { name: /In person · \$50/ }).check();
    const plan = page.locator(".planner-plan");
    await expect(plan.getByRole("heading", { level: 3 })).toHaveText("Economics · Test prep");
    await expect(plan).toContainText("A quick skills check in Economics");
    await expect(plan).toContainText("In person, at $50 per hour.");
    await page.getByRole("button", { name: "Put this in the booking form" }).click();
    await expect(page.locator("#plan-status")).toContainText("Added to the booking form");
    await expect(page.locator("#tutor-subject")).toHaveValue("History and social studies");
    await expect(page.locator('#book input[name="meeting"][value="In person"]')).toBeChecked();
    await expect(page.locator("#tutor-message")).toHaveValue("Course: Economics. What feels stuck: Test prep.");
    await expect(page.locator("#tutor-name")).toBeFocused();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `tutoring overflow at ${width}`).toBeLessThanOrEqual(1);
    expect(requests, `the planner makes no requests at ${width}`).toEqual([]);
  }
  await page.getByLabel("Parent or guardian name (required)").fill("Ada Lovelace");
  await page.getByLabel("Email (required)").fill("qa@example.com");
  await page.getByLabel("Student grade (required)").selectOption({ label: "Grade 9" });
  await page.locator("#book").getByRole("button", { name: "Book with us", exact: true }).click();
  await expect(page.locator("#book [data-thanks]")).toBeVisible();
  expect(Object.keys(posts[0]).sort()).toEqual(
    ["_captcha", "_subject", "email", "grade", "meeting", "message", "parent_name", "phone", "preferred_times", "subject"].sort(),
  );
});

test("the about journal turns pages and values open to where they show up", async ({ page }) => {
  for (const width of [1366, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/about.html?journal=${width}`);
    const pagesShown = page.locator(".journal-page:visible");
    await expect(pagesShown).toHaveCount(1);
    await expect(pagesShown).toContainText("Griffin & Quill LLC is formed.");
    await expect(page.locator("#journal-count")).toHaveText("Page 1 of 5");
    await expect(page.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await page.getByRole("button", { name: "Next page" }).click();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(pagesShown).toContainText("October 12, 2026");
    await expect(page.locator("#journal-count")).toHaveText("Page 3 of 5");
    for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "Next page" }).click({ force: true });
    await expect(page.locator("#journal-count")).toHaveText("Page 5 of 5");
    await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
    const value = page.locator("details.value").filter({ hasText: "Teacher-built rigor" });
    await value.locator("summary").click();
    await expect(value).toHaveJSProperty("open", true);
    await expect(value.getByRole("link", { name: "Browse the shelf" })).toHaveAttribute("href", "store.html#shelf");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `about overflow at ${width}`).toBeLessThanOrEqual(1);
  }
  await expect(page.getByText("empty slot")).toHaveCount(0);
});

test("the about journal lists every entry when JavaScript is off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/about.html");
  await expect(page.locator(".journal-page:visible")).toHaveCount(5);
  await expect(page.locator(".journal-controls")).toBeHidden();
  await context.close();
});

test("the contact letter desk shows the right inbox and only sets the existing topic", async ({ page }) => {
  for (const width of [1366, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/contact.html?desk=${width}`);
    await expect(page.locator(".letter:visible")).toHaveCount(1);
    await expect(page.locator(".letter:visible")).toContainText("hello@griffinandquill.com");
    await page.getByRole("radio", { name: /Partnerships and press/ }).check();
    const letter = page.locator(".letter:visible");
    await expect(letter).toContainText("partners@griffinandquill.com");
    await expect(letter.getByRole("link", { name: "Open the Families inquiry" })).toHaveAttribute("href", "schools.html#inquiry");
    await letter.getByRole("button", { name: "Write it below" }).click();
    await expect(page.locator("#contact-topic")).toHaveValue("Partnerships");
    await expect(page.locator("#desk-status")).toContainText("This form goes to hello@griffinandquill.com.");
    await expect(page.locator("#contact-name")).toBeFocused();
    await page.getByRole("radio", { name: /^T Tutoring|Tutoring tutoring@/ }).check();
    await expect(page.locator(".letter:visible")).toContainText("tutoring@griffinandquill.com");
    await expect(page.locator(".letter:visible").getByRole("link", { name: "Go to tutoring booking" })).toHaveAttribute("href", "tutoring.html#book");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `contact overflow at ${width}`).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('form[data-form="hello"] [name]')).toHaveCount(8);
});
