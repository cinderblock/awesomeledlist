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

describe("Search Input Tests", () => {
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

  test("Type into search box character by character on pixels page", async () => {
    // Navigate to the pixels page
    await waitForLoad(page, `${serverUrl}/pixels`);

    // Wait for the search input to be available
    const searchInputSelector = 'input[placeholder="Search..."]';
    await page.waitForSelector(searchInputSelector, { timeout: 5000 });

    // Focus the search input
    await page.click(searchInputSelector);

    // Type "ws281" character by character with a small delay between each
    const searchTerm = "ws281";
    for (const char of searchTerm) {
      await page.keyboard.type(char, { delay: 50 });
      // Small delay to let React state update
      await new Promise((r) => setTimeout(r, 100));
    }

    // Wait a bit for the filtering to complete
    await new Promise((r) => setTimeout(r, 300));

    // Verify the search input has the correct value
    const inputValue = await page.$eval(
      searchInputSelector,
      (el) => (el as HTMLInputElement).value
    );
    expect(inputValue).toBe(searchTerm);

    // Verify that the URL contains the search query parameter
    const url = page.url();
    expect(url).toContain("q=ws281");

    // Verify that the results are filtered
    const entriesText = await page.$eval(".text-muted-foreground.text-sm", (el) => el.textContent);
    expect(entriesText).toBeTruthy();

    const match = entriesText?.match(/(\d+)\s+of\s+(\d+)/);
    expect(match).toBeTruthy();

    const [, filtered, total] = match!;
    expect(parseInt(filtered)).toBeLessThanOrEqual(parseInt(total));
  });

  test("Each character typed updates search incrementally", async () => {
    // Navigate fresh to the pixels page
    await waitForLoad(page, `${serverUrl}/pixels`);

    const searchInputSelector = 'input[placeholder="Search..."]';
    await page.waitForSelector(searchInputSelector, { timeout: 5000 });

    // Focus the search input
    await page.click(searchInputSelector);

    // Track input values after each character
    const expectedValues = ["w", "ws", "ws2", "ws28", "ws281"];
    const actualValues: string[] = [];

    for (let i = 0; i < expectedValues.length; i++) {
      const char = expectedValues[i][i]; // Get the character to type
      await page.keyboard.type(char, { delay: 50 });

      // Wait for React to update
      await new Promise((r) => setTimeout(r, 150));

      // Get current input value
      const currentValue = await page.$eval(
        searchInputSelector,
        (el) => (el as HTMLInputElement).value
      );
      actualValues.push(currentValue);
    }

    // Verify each character was captured
    for (let i = 0; i < expectedValues.length; i++) {
      expect(actualValues[i]).toBe(expectedValues[i]);
    }
  });
});
