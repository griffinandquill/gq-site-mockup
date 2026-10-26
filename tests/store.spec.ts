import { expect, test, type Page } from "@playwright/test";

const subjects = [
  ["World History", "world-history"],
  ["U.S. History", "us-history"],
  ["Government", "government"],
  ["Economics", "economics"],
  ["AP Human Geography", "ap-human-geography"],
] as const;

async function quiet(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test.beforeEach(async ({ context }) => {
  await context.route("https://www.teacherspayteachers.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!DOCTYPE html><title>Teachers Pay Teachers</title><h1>Teachers Pay Teachers</h1>",
    });
  });
});

test("subject tiles, search, filters, and the World War I card", async ({ page }) => {
  const errors = await quiet(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/store.html");
  await expect(page.getByRole("heading", { level: 1, name: "Classroom units and simulations." })).toBeVisible();
  await expect(page.locator("#site-nav").getByRole("link", { name: "Curriculum", exact: true })).toHaveCount(0);

  const visit = page.getByRole("link", { name: "Visit our TPT store" }).first();
  await expect(visit).toHaveAttribute("href", "https://www.teacherspayteachers.com/store/griffin-quill");
  await expect(visit).toHaveAttribute("target", "_blank");

  for (const [name, id] of subjects) {
    await page.locator("#unit-quests").getByRole("button", { name }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.getByRole("heading", { name: `${name} units` })).toBeVisible();
    if (name === "U.S. History") {
      const card = page.locator("article.unit-card");
      await expect(card.getByRole("heading", { name: "World War I Unit Bundle" })).toBeVisible();
      await expect(card.getByText("$36", { exact: true })).toBeVisible();
      await expect(card.getByText("Grades 9-12")).toBeVisible();
      await expect(card.getByText("Study guide")).toBeVisible();
      const natural = await card.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(natural).toBeGreaterThan(200);
    } else {
      await expect(page.locator("#store-results")).toContainText("Coming soon, follow our TPT store");
      await expect(page.locator("article.unit-card")).toHaveCount(0);
    }
  }

  await page.locator("#sim-quests").getByRole("button", { name: "U.S. History" }).click();
  await expect(page).toHaveURL(/#sim-us-history$/);
  await expect(page.getByRole("heading", { name: "U.S. History simulations" })).toBeVisible();
  await expect(page.locator("#store-results")).toContainText("Coming soon, follow our TPT store");

  for (const [name] of subjects) {
    await page.locator("#sim-quests").getByRole("button", { name }).click();
    await expect(page.locator("#store-results")).toContainText("Coming soon, follow our TPT store");
  }

  await page.getByRole("radio", { name: "Units" }).check();
  await expect(page).toHaveURL(/kind=unit/);
  await expect(page.locator("article.unit-card").getByText("$36", { exact: true })).toBeVisible();

  await page.getByRole("radio", { name: "Simulations" }).check();
  await expect(page.locator("#store-results")).toContainText("Coming soon, follow our TPT store");
  await expect(page.locator("article.unit-card")).toHaveCount(0);

  await page.getByRole("radio", { name: "All" }).check();
  await page.getByLabel("Search units and simulations").fill("World War");
  await expect(page).toHaveURL(/q=World\+War|q=World%20War/);
  const card = page.locator("article.unit-card");
  await expect(card.getByRole("heading", { name: "World War I Unit Bundle" })).toBeVisible();
  await expect(card.getByText("$36", { exact: true })).toBeVisible();

  await page.getByLabel("Search units and simulations").fill("zzzz-not-a-unit");
  await expect(page.locator("#store-results")).toContainText("No matches for that search");
  await expect(page.locator("article.unit-card")).toHaveCount(0);

  await page.getByLabel("Search units and simulations").fill("packet");
  await card.getByRole("button", { name: "World War I Unit Bundle" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "World War I Unit Bundle" })).toBeVisible();
  await expect(dialog.getByText("$36", { exact: true })).toBeVisible();
  await expect(dialog.getByText(/South Carolina USHC Standard 4/)).toBeVisible();
  await expect(dialog.locator("img").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.goto("/store.html#us-history");
  await expect(page.locator("article.unit-card").getByText("$36", { exact: true })).toBeVisible();
  const buy = page.locator("article.unit-card").getByRole("link", { name: "Buy on TPT" });
  await expect(buy).toHaveAttribute("target", "_blank");
  await expect(buy).toHaveAttribute("rel", /noopener/);
  const popupPromise = page.waitForEvent("popup");
  await buy.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/teacherspayteachers\.com\/Product\/Griffin-Quill-World-War-1-Unit-Bundle-18086100/);
  await popup.close();

  expect(errors).toEqual([]);
});

test("arrow keys move across the subject tiles", async ({ page }) => {
  const errors = await quiet(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/store.html");
  const tiles = page.locator("#unit-quests .quest-tile");
  await tiles.nth(0).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tiles.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#us-history$/);
  await expect(page.locator("article.unit-card").getByText("$36", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the store fits a phone and a desktop window", async ({ page }) => {
  const errors = await quiet(page);
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/store.html?view=${width}#us-history`);
    const card = page.locator("article.unit-card");
    await expect(card.getByText("$36", { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Buy on TPT" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${width}`).toBeLessThanOrEqual(1);
    await card.getByRole("button", { name: "World War I Unit Bundle" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.width || 0).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  expect(errors).toEqual([]);
});
