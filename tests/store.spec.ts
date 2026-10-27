import { expect, test, type Page } from "@playwright/test";

const subjects = [
  ["World History", "world-history"],
  ["U.S. History", "us-history"],
  ["Government", "government"],
  ["Economics", "economics"],
  ["AP Human Geography", "ap-human-geography"],
] as const;

function unitCard(page: Page, title: string) {
  return page.locator("article.unit-card").filter({
    has: page.getByRole("heading", { name: title }),
  });
}

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
      await expect(page.locator("article.unit-card")).toHaveCount(13);
      await expect(page.locator("article.unit-card h3")).toHaveText([
        "Colonial America Unit Bundle",
        "American Revolution & Constitution Unit Bundle",
        "The Early Republic",
        "Expansion & Sectionalism Unit Bundle",
        "Civil War & Reconstruction Unit Bundle",
        "Gilded Age: Industry, Labor, Immigration & the West",
        "Populism, Progressives & Imperialism",
        "World War I Unit Bundle",
        "Roaring Twenties, Depression & New Deal Unit Bundle",
        "World War II Unit Bundle",
        "Cold War and the Postwar Boom",
        "Civil Rights and Social Movements",
        "Modern America: Late Cold War to Today",
      ]);
      const gilded = unitCard(page, "Gilded Age: Industry, Labor, Immigration & the West");
      await expect(gilded.getByText("$40", { exact: true })).toBeVisible();
      await expect(gilded.getByText("Grades 9-12")).toBeVisible();
      await expect(gilded.getByText("10 lessons")).toBeVisible();
      const gildedWidth = await gilded.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(gildedWidth).toBeGreaterThan(200);
      const populism = unitCard(page, "Populism, Progressives & Imperialism");
      await expect(populism.getByText("$40", { exact: true })).toBeVisible();
      await expect(populism.getByText("Grades 9-12")).toBeVisible();
      await expect(populism.getByText("10 lessons")).toBeVisible();
      const populismWidth = await populism.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(populismWidth).toBeGreaterThan(200);
      const coldWar = unitCard(page, "Cold War and the Postwar Boom");
      await expect(coldWar.getByText("$36", { exact: true })).toBeVisible();
      await expect(coldWar.getByText("Grades 9-12")).toBeVisible();
      await expect(coldWar.getByText("9 lessons")).toBeVisible();
      const coldWarWidth = await coldWar.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(coldWarWidth).toBeGreaterThan(200);
      const civilRights = unitCard(page, "Civil Rights and Social Movements");
      await expect(civilRights.getByText("$40", { exact: true })).toBeVisible();
      await expect(civilRights.getByText("Grades 9-12")).toBeVisible();
      await expect(civilRights.getByText("10 lessons")).toBeVisible();
      const civilRightsWidth = await civilRights.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(civilRightsWidth).toBeGreaterThan(200);
      const modernAmerica = unitCard(page, "Modern America: Late Cold War to Today");
      await expect(modernAmerica.getByText("$36", { exact: true })).toBeVisible();
      await expect(modernAmerica.getByText("Grades 9-12")).toBeVisible();
      await expect(modernAmerica.getByText("9 lessons")).toBeVisible();
      const modernAmericaWidth = await modernAmerica.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(modernAmericaWidth).toBeGreaterThan(200);
      const twenties = unitCard(page, "Roaring Twenties, Depression & New Deal Unit Bundle");
      await expect(twenties.getByText("$40", { exact: true })).toBeVisible();
      await expect(twenties.getByText("Grades 9-12")).toBeVisible();
      await expect(twenties.getByText("10 lessons")).toBeVisible();
      const twentiesWidth = await twenties.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(twentiesWidth).toBeGreaterThan(200);
      const expansion = unitCard(page, "Expansion & Sectionalism Unit Bundle");
      await expect(expansion.getByText("$40", { exact: true })).toBeVisible();
      await expect(expansion.getByText("Grades 9-12")).toBeVisible();
      await expect(expansion.getByText("10 lessons")).toBeVisible();
      const expansionWidth = await expansion.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(expansionWidth).toBeGreaterThan(200);
      const civilWar = unitCard(page, "Civil War & Reconstruction Unit Bundle");
      await expect(civilWar.getByText("$40", { exact: true })).toBeVisible();
      await expect(civilWar.getByText("Grades 9-12")).toBeVisible();
      await expect(civilWar.getByText("10 lessons")).toBeVisible();
      const civilWarWidth = await civilWar.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(civilWarWidth).toBeGreaterThan(200);
      const revolution = unitCard(page, "American Revolution & Constitution Unit Bundle");
      await expect(revolution.getByText("$40", { exact: true })).toBeVisible();
      await expect(revolution.getByText("Grades 9-12")).toBeVisible();
      await expect(revolution.getByText("10 lessons")).toBeVisible();
      const revolutionWidth = await revolution.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(revolutionWidth).toBeGreaterThan(200);
      const earlyRepublic = unitCard(page, "The Early Republic");
      await expect(earlyRepublic.getByText("$28", { exact: true })).toBeVisible();
      await expect(earlyRepublic.getByText("Grades 9-12")).toBeVisible();
      await expect(earlyRepublic.getByText("7 lessons")).toBeVisible();
      const earlyRepublicWidth = await earlyRepublic.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(earlyRepublicWidth).toBeGreaterThan(200);
      const colonial = unitCard(page, "Colonial America Unit Bundle");
      await expect(colonial.getByText("$36", { exact: true })).toBeVisible();
      await expect(colonial.getByText("Grades 9-12")).toBeVisible();
      await expect(colonial.getByText("9 lessons")).toBeVisible();
      const colonialWidth = await colonial.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(colonialWidth).toBeGreaterThan(200);
      for (const title of ["World War I Unit Bundle", "World War II Unit Bundle"]) {
        const card = unitCard(page, title);
        await expect(card.getByText("$36", { exact: true })).toBeVisible();
        await expect(card.getByText("Grades 9-12")).toBeVisible();
        await expect(card.getByText("Study guide")).toBeVisible();
        const natural = await card.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth);
        expect(natural).toBeGreaterThan(200);
      }
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
  await expect(page.locator("article.unit-card")).toHaveCount(13);
  await expect(unitCard(page, "Modern America: Late Cold War to Today").getByText("$36", { exact: true })).toBeVisible();

  await page.getByRole("radio", { name: "Simulations" }).check();
  await expect(page.locator("#store-results")).toContainText("Coming soon, follow our TPT store");
  await expect(page.locator("article.unit-card")).toHaveCount(0);

  await page.getByRole("radio", { name: "All" }).check();
  await page.getByLabel("Search units and simulations").fill("World War");
  await expect(page).toHaveURL(/q=World\+War|q=World%20War/);
  await expect(page.locator("article.unit-card")).toHaveCount(2);
  await expect(unitCard(page, "World War I Unit Bundle")).toBeVisible();
  await expect(unitCard(page, "World War II Unit Bundle").getByText("$36", { exact: true })).toBeVisible();

  await page.getByLabel("Search units and simulations").fill("World War II");
  await expect(page.locator("article.unit-card")).toHaveCount(1);
  await expect(unitCard(page, "World War II Unit Bundle")).toBeVisible();

  await page.getByLabel("Search units and simulations").fill("zzzz-not-a-unit");
  await expect(page.locator("#store-results")).toContainText("No matches for that search");
  await expect(page.locator("article.unit-card")).toHaveCount(0);

  await page.getByLabel("Search units and simulations").fill("packet");
  await unitCard(page, "World War I Unit Bundle").getByRole("button", { name: "World War I Unit Bundle" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "World War I Unit Bundle" })).toBeVisible();
  await expect(dialog.getByText("$36", { exact: true })).toBeVisible();
  await expect(dialog.getByText(/South Carolina USHC Standard 4/)).toBeVisible();
  await expect(dialog.locator("img").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.goto("/store.html#us-history");
  const wwiBuy = unitCard(page, "World War I Unit Bundle").getByRole("link", { name: "Buy on TPT" });
  await expect(wwiBuy).toHaveAttribute("target", "_blank");
  await expect(wwiBuy).toHaveAttribute("rel", /noopener/);
  const wwiPopupPromise = page.waitForEvent("popup");
  await wwiBuy.click();
  const wwiPopup = await wwiPopupPromise;
  await expect(wwiPopup).toHaveURL(/teacherspayteachers\.com\/Product\/Griffin-Quill-World-War-1-Unit-Bundle-18086100/);
  await wwiPopup.close();

  const gildedBuy = unitCard(page, "Gilded Age: Industry, Labor, Immigration & the West").getByRole("link", { name: "Buy on TPT" });
  await expect(gildedBuy).toHaveAttribute("target", "_blank");
  await expect(gildedBuy).toHaveAttribute("rel", /noopener/);
  await expect(gildedBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Gilded-Age-Unit-US-History-Labor-Immigration-West-DBQ-Test-9-12-18090158",
  );
  const gildedPopupPromise = page.waitForEvent("popup");
  await gildedBuy.click();
  const gildedPopup = await gildedPopupPromise;
  await expect(gildedPopup).toHaveURL(/Gilded-Age-Unit-US-History-Labor-Immigration-West-DBQ-Test-9-12-18090158/);
  await gildedPopup.close();

  const populismBuy = unitCard(page, "Populism, Progressives & Imperialism").getByRole("link", { name: "Buy on TPT" });
  await expect(populismBuy).toHaveAttribute("target", "_blank");
  await expect(populismBuy).toHaveAttribute("rel", /noopener/);
  await expect(populismBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Populism-Progressives-Unit-US-History-Imperialism-DBQ-Test-9-12-18090347",
  );
  const populismPopupPromise = page.waitForEvent("popup");
  await populismBuy.click();
  const populismPopup = await populismPopupPromise;
  await expect(populismPopup).toHaveURL(/Populism-Progressives-Unit-US-History-Imperialism-DBQ-Test-9-12-18090347/);
  await populismPopup.close();

  const civilRightsBuy = unitCard(page, "Civil Rights and Social Movements").getByRole("link", { name: "Buy on TPT" });
  await expect(civilRightsBuy).toHaveAttribute("target", "_blank");
  await expect(civilRightsBuy).toHaveAttribute("rel", /noopener/);
  await expect(civilRightsBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Civil-Rights-Movement-Unit-US-History-Brown-to-Selma-DBQ-Test-9-12-18090569",
  );
  const civilRightsPopupPromise = page.waitForEvent("popup");
  await civilRightsBuy.click();
  const civilRightsPopup = await civilRightsPopupPromise;
  await expect(civilRightsPopup).toHaveURL(/Civil-Rights-Movement-Unit-US-History-Brown-to-Selma-DBQ-Test-9-12-18090569/);
  await civilRightsPopup.close();

  const coldWarBuy = unitCard(page, "Cold War and the Postwar Boom").getByRole("link", { name: "Buy on TPT" });
  await expect(coldWarBuy).toHaveAttribute("target", "_blank");
  await expect(coldWarBuy).toHaveAttribute("rel", /noopener/);
  await expect(coldWarBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Cold-War-Unit-US-History-Iron-Curtain-to-Vietnam-DBQ-Test-9-12-18090740",
  );
  const coldWarPopupPromise = page.waitForEvent("popup");
  await coldWarBuy.click();
  const coldWarPopup = await coldWarPopupPromise;
  await expect(coldWarPopup).toHaveURL(/Cold-War-Unit-US-History-Iron-Curtain-to-Vietnam-DBQ-Test-9-12-18090740/);
  await coldWarPopup.close();

  const earlyRepublicBuy = unitCard(page, "The Early Republic").getByRole("link", { name: "Buy on TPT" });
  await expect(earlyRepublicBuy).toHaveAttribute("target", "_blank");
  await expect(earlyRepublicBuy).toHaveAttribute("rel", /noopener/);
  await expect(earlyRepublicBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Early-Republic-Unit-US-History-Hamilton-to-War-of-1812-DBQ-Test-9-12-18090912",
  );
  const earlyRepublicPopupPromise = page.waitForEvent("popup");
  await earlyRepublicBuy.click();
  const earlyRepublicPopup = await earlyRepublicPopupPromise;
  await expect(earlyRepublicPopup).toHaveURL(/Early-Republic-Unit-US-History-Hamilton-to-War-of-1812-DBQ-Test-9-12-18090912/);
  await earlyRepublicPopup.close();

  const modernAmericaBuy = unitCard(page, "Modern America: Late Cold War to Today").getByRole("link", { name: "Buy on TPT" });
  await expect(modernAmericaBuy).toHaveAttribute("target", "_blank");
  await expect(modernAmericaBuy).toHaveAttribute("rel", /noopener/);
  await expect(modernAmericaBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Modern-America-Unit-US-History-1968-to-Today-Watergate-911-DBQ-9-12-18091106",
  );
  const modernAmericaPopupPromise = page.waitForEvent("popup");
  await modernAmericaBuy.click();
  const modernAmericaPopup = await modernAmericaPopupPromise;
  await expect(modernAmericaPopup).toHaveURL(/Modern-America-Unit-US-History-1968-to-Today-Watergate-911-DBQ-9-12-18091106/);
  await modernAmericaPopup.close();

  const twentiesBuy = unitCard(page, "Roaring Twenties, Depression & New Deal Unit Bundle").getByRole("link", { name: "Buy on TPT" });
  await expect(twentiesBuy).toHaveAttribute("target", "_blank");
  await expect(twentiesBuy).toHaveAttribute("rel", /noopener/);
  await expect(twentiesBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Roaring-Twenties-Depression-New-Deal-Unit-US-History-DBQ-Test-9-12-18089503",
  );
  const twentiesPopupPromise = page.waitForEvent("popup");
  await twentiesBuy.click();
  const twentiesPopup = await twentiesPopupPromise;
  await expect(twentiesPopup).toHaveURL(/Roaring-Twenties-Depression-New-Deal-Unit-US-History-DBQ-Test-9-12-18089503/);
  await twentiesPopup.close();

  const wwiiBuy = unitCard(page, "World War II Unit Bundle").getByRole("link", { name: "Buy on TPT" });
  await expect(wwiiBuy).toHaveAttribute("target", "_blank");
  await expect(wwiiBuy).toHaveAttribute("rel", /noopener/);
  await expect(wwiiBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/World-War-II-Unit-Bundle-US-History-Slides-Packets-DBQ-Test-Grades-9-12-18087243",
  );
  const wwiiPopupPromise = page.waitForEvent("popup");
  await wwiiBuy.click();
  const wwiiPopup = await wwiiPopupPromise;
  await expect(wwiiPopup).toHaveURL(/World-War-II-Unit-Bundle-US-History-Slides-Packets-DBQ-Test-Grades-9-12-18087243/);
  await wwiiPopup.close();

  const colonialBuy = unitCard(page, "Colonial America Unit Bundle").getByRole("link", { name: "Buy on TPT" });
  await expect(colonialBuy).toHaveAttribute("target", "_blank");
  await expect(colonialBuy).toHaveAttribute("rel", /noopener/);
  await expect(colonialBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Colonial-America-Unit-Bundle-US-History-Slides-Packets-DBQ-Test-9-12-18087918",
  );
  const colonialPopupPromise = page.waitForEvent("popup");
  await colonialBuy.click();
  const colonialPopup = await colonialPopupPromise;
  await expect(colonialPopup).toHaveURL(/Colonial-America-Unit-Bundle-US-History-Slides-Packets-DBQ-Test-9-12-18087918/);
  await colonialPopup.close();

  const revolutionBuy = unitCard(page, "American Revolution & Constitution Unit Bundle").getByRole("link", { name: "Buy on TPT" });
  await expect(revolutionBuy).toHaveAttribute("target", "_blank");
  await expect(revolutionBuy).toHaveAttribute("rel", /noopener/);
  await expect(revolutionBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/American-Revolution-Constitution-Unit-US-History-Slides-DBQ-Test-9-12-18088204",
  );
  const revolutionPopupPromise = page.waitForEvent("popup");
  await revolutionBuy.click();
  const revolutionPopup = await revolutionPopupPromise;
  await expect(revolutionPopup).toHaveURL(/American-Revolution-Constitution-Unit-US-History-Slides-DBQ-Test-9-12-18088204/);
  await revolutionPopup.close();

  const expansionBuy = unitCard(page, "Expansion & Sectionalism Unit Bundle").getByRole("link", { name: "Buy on TPT" });
  await expect(expansionBuy).toHaveAttribute("target", "_blank");
  await expect(expansionBuy).toHaveAttribute("rel", /noopener/);
  await expect(expansionBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Expansion-Sectionalism-Unit-US-History-Slides-DBQ-Test-Grades-9-12-18089162",
  );
  const expansionPopupPromise = page.waitForEvent("popup");
  await expansionBuy.click();
  const expansionPopup = await expansionPopupPromise;
  await expect(expansionPopup).toHaveURL(/Expansion-Sectionalism-Unit-US-History-Slides-DBQ-Test-Grades-9-12-18089162/);
  await expansionPopup.close();

  const civilWarBuy = unitCard(page, "Civil War & Reconstruction Unit Bundle").getByRole("link", { name: "Buy on TPT" });
  await expect(civilWarBuy).toHaveAttribute("target", "_blank");
  await expect(civilWarBuy).toHaveAttribute("rel", /noopener/);
  await expect(civilWarBuy).toHaveAttribute(
    "href",
    "https://www.teacherspayteachers.com/Product/Civil-War-Reconstruction-Unit-US-History-Slides-DBQ-Test-Grades-9-12-18088664",
  );
  const civilWarPopupPromise = page.waitForEvent("popup");
  await civilWarBuy.click();
  const civilWarPopup = await civilWarPopupPromise;
  await expect(civilWarPopup).toHaveURL(/Civil-War-Reconstruction-Unit-US-History-Slides-DBQ-Test-Grades-9-12-18088664/);
  await civilWarPopup.close();

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
  await expect(unitCard(page, "World War II Unit Bundle").getByText("$36", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the store fits a phone and a desktop window", async ({ page }) => {
  const errors = await quiet(page);
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/store.html?view=${width}#us-history`);
    await expect(page.locator("article.unit-card")).toHaveCount(13);
    const card = unitCard(page, "World War II Unit Bundle");
    await expect(card.getByText("$36", { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Buy on TPT" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${width}`).toBeLessThanOrEqual(1);
    await card.getByRole("button", { name: "World War II Unit Bundle" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.width || 0).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  expect(errors).toEqual([]);
});
