import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import puppeteer, { Browser, Page } from "puppeteer";
import { spawn, ChildProcess } from "child_process";
import { createServer } from "net";

let browser: Browser;
let page: Page;
let devServer: ChildProcess | null = null;
let serverUrl: string;

// Find an available port
async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Could not get port"));
      }
    });
  });
}

// Start the dev server on a specific port
async function startDevServer(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const command = isWindows ? "bun.exe" : "bun";

    devServer = spawn(command, ["run", "dev", "--port", String(port)], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      shell: isWindows,
    });

    const timeout = setTimeout(() => {
      reject(new Error("Dev server failed to start within 30 seconds"));
    }, 30000);

    devServer.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      if (output.includes("Local:") || output.includes("ready in")) {
        clearTimeout(timeout);
        setTimeout(resolve, 1000);
      }
    });

    devServer.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();
      if (output.includes("Local:") || output.includes("ready in")) {
        clearTimeout(timeout);
        setTimeout(resolve, 1000);
      }
    });

    devServer.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    devServer.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Dev server exited with code ${code}`));
      }
    });
  });
}

function stopDevServer(): void {
  if (devServer) {
    const isWindows = process.platform === "win32";
    if (isWindows) {
      spawn("taskkill", ["/pid", String(devServer.pid), "/f", "/t"], { shell: true });
    } else {
      devServer.kill("SIGTERM");
    }
    devServer = null;
  }
}

async function waitForLoad(p: Page, url?: string) {
  if (url) {
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  }
  await p.waitForFunction(() => document.querySelector("#root")?.children.length > 0, {
    timeout: 10000,
  });
}

async function clickAndWaitForNavigation(p: Page, selector: string) {
  await p.waitForSelector(selector, { timeout: 5000 });
  const currentUrl = p.url();
  await p.click(selector);
  await p.waitForFunction(
    (prevUrl: string) => window.location.href !== prevUrl,
    { timeout: 10000 },
    currentUrl
  );
  await p.waitForFunction(() => document.querySelector("#root")?.children.length > 0, {
    timeout: 10000,
  });
  await new Promise((r) => setTimeout(r, 300));
}

// Helper to verify a category page loaded correctly
async function expectCategoryPageLoaded(p: Page, categoryName: string) {
  await p.waitForSelector("h1", { timeout: 5000 });
  const heading = await p.$eval("h1", (el) => el.textContent);
  expect(heading?.toLowerCase()).toContain(categoryName.toLowerCase());

  // Verify data content loaded (table or tiles)
  const hasContent = await p.evaluate(() => {
    const table = document.querySelector("table");
    const tiles = document.querySelectorAll("[data-entry-id]");
    return (table && table.rows.length > 1) || tiles.length > 0;
  });
  expect(hasContent).toBe(true);
}

// Helper to verify home page loaded correctly
async function expectHomePageLoaded(p: Page) {
  // Home page should have category cards
  const hasCards = await p.evaluate(() => {
    const cards = document.querySelectorAll("[data-category-card]");
    return cards.length > 0;
  });
  expect(hasCards).toBe(true);
}

// Helper to verify about page loaded correctly
async function expectAboutPageLoaded(p: Page) {
  await p.waitForSelector("h1", { timeout: 5000 });
  const heading = await p.$eval("h1", (el) => el.textContent);
  expect(heading?.toLowerCase()).toContain("about");
}

// Helper to verify detail page loaded correctly
async function expectDetailPageLoaded(p: Page) {
  // Detail pages should have an h1 with the entry name and some content
  await p.waitForSelector("h1", { timeout: 5000 });
  const hasContent = await p.evaluate(() => {
    const h1 = document.querySelector("h1");
    const hasBackLink = document.querySelector('a[href*="/controllers"]') !== null;
    return h1 && h1.textContent && h1.textContent.length > 0 && hasBackLink;
  });
  expect(hasContent).toBe(true);
}

describe("Navigation Tests", () => {
  beforeAll(async () => {
    const port = await findAvailablePort();
    serverUrl = `http://localhost:${port}`;
    await startDevServer(port);

    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== "false",
      slowMo: process.env.HEADLESS === "false" ? 50 : 0,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterAll(async () => {
    await browser?.close();
    stopDevServer();
  });

  test("Home page loads", async () => {
    await waitForLoad(page, serverUrl);
    const title = await page.title();
    expect(title.includes("LED") || title.includes("Awesome")).toBe(true);
    await expectHomePageLoaded(page);
  });

  test("Navigate from Home to category page (Controllers)", async () => {
    await waitForLoad(page, serverUrl);
    const cardSelector = '[data-category-card="controllers"]';
    await clickAndWaitForNavigation(page, cardSelector);

    const url = page.url();
    expect(url).toContain("/controllers");
    await expectCategoryPageLoaded(page, "controller");
  });

  test("Navigate from category page to detail page", async () => {
    await waitForLoad(page, `${serverUrl}/controllers`);

    const entryLinkSelector = 'a[href*="/controllers/"]';
    await page.waitForSelector(entryLinkSelector, { timeout: 5000 });

    const href = await page.$eval(entryLinkSelector, (el) => el.getAttribute("href"));
    expect(href).toBeTruthy();
    expect(href).not.toBe("/controllers/");

    await clickAndWaitForNavigation(page, entryLinkSelector);

    const url = page.url();
    expect(url).toContain("/controllers/");
    expect(url.endsWith("/controllers/")).toBe(false);
    await expectDetailPageLoaded(page);
  });

  test("Navigate between categories using CategoryNav tabs", async () => {
    await waitForLoad(page, `${serverUrl}/controllers`);

    const pixelsTabSelector = '[data-category="pixels"]';
    await clickAndWaitForNavigation(page, pixelsTabSelector);

    const url = page.url();
    expect(url).toContain("/pixels");
    await expectCategoryPageLoaded(page, "pixel");
  });

  test("Navigate back to home via header logo", async () => {
    await waitForLoad(page, `${serverUrl}/controllers`);

    const logoSelector = 'header a[href="/"]';
    await clickAndWaitForNavigation(page, logoSelector);

    const url = page.url();
    const pathname = new URL(url).pathname;
    expect(pathname).toBe("/");
    await expectHomePageLoaded(page);
  });

  test("Navigate to About page", async () => {
    await waitForLoad(page, serverUrl);

    const aboutSelector = 'a[href="/about"]';
    await clickAndWaitForNavigation(page, aboutSelector);

    const url = page.url();
    expect(url).toContain("/about");
    await expectAboutPageLoaded(page);
  });

  test("Browser back navigation works", async () => {
    await waitForLoad(page, serverUrl);

    const cardSelector = '[data-category-card="controllers"]';
    await clickAndWaitForNavigation(page, cardSelector);

    let url = page.url();
    expect(url).toContain("/controllers");
    await expectCategoryPageLoaded(page, "controller");

    const currentUrl = page.url();
    await page.goBack();

    await page.waitForFunction(
      (prevUrl: string) => window.location.href !== prevUrl,
      { timeout: 10000 },
      currentUrl
    );

    await page.waitForFunction(() => document.querySelector("#root")?.children.length > 0, {
      timeout: 10000,
    });

    url = page.url();
    const pathname = new URL(url).pathname;
    expect(pathname).toBe("/");
    await expectHomePageLoaded(page);
  });

  test("Can navigate to different category after using back button", async () => {
    await waitForLoad(page, serverUrl);

    await clickAndWaitForNavigation(page, '[data-category-card="controllers"]');
    let url = page.url();
    expect(url).toContain("/controllers");
    await expectCategoryPageLoaded(page, "controller");

    await page.goBack();
    await page.waitForFunction(() => window.location.pathname === "/", { timeout: 10000 });
    await page.waitForFunction(() => document.querySelector("#root")?.children.length > 0, {
      timeout: 10000,
    });
    await new Promise((r) => setTimeout(r, 500));
    await expectHomePageLoaded(page);

    await clickAndWaitForNavigation(page, '[data-category-card="pixels"]');

    url = page.url();
    expect(url).toContain("/pixels");
    await expectCategoryPageLoaded(page, "pixel");
  });

  test("Multiple sequential navigations work", async () => {
    await page.goto(serverUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForFunction(() => document.querySelector("#root")?.children.length > 0, {
      timeout: 10000,
    });
    await new Promise((r) => setTimeout(r, 500));
    await expectHomePageLoaded(page);

    // Home -> Controllers
    await clickAndWaitForNavigation(page, '[data-category-card="controllers"]');
    expect(page.url()).toContain("/controllers");
    await expectCategoryPageLoaded(page, "controller");

    // Back to home
    await page.goBack();
    await page.waitForFunction(() => window.location.pathname === "/", { timeout: 10000 });
    await page.waitForFunction(
      () => document.querySelector('[data-category-card="pixels"]') !== null,
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 500));
    await expectHomePageLoaded(page);

    // To pixels
    await clickAndWaitForNavigation(page, '[data-category-card="pixels"]');
    expect(page.url()).toContain("/pixels");
    await expectCategoryPageLoaded(page, "pixel");

    // Back to home
    await page.goBack();
    await page.waitForFunction(() => window.location.pathname === "/", { timeout: 10000 });
    await page.waitForFunction(
      () => document.querySelector('[data-category-card="connectors"]') !== null,
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 500));
    await expectHomePageLoaded(page);

    // To connectors
    await clickAndWaitForNavigation(page, '[data-category-card="connectors"]');
    expect(page.url()).toContain("/connectors");
    await expectCategoryPageLoaded(page, "connector");
  });
});
