import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
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
