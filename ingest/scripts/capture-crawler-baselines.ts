#!/usr/bin/env node

import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";

type SourceEntry = {
  id: string;
  url: string;
};

type WebCrawlerSource = {
  id: string;
  extractorImportPath: string;
};

const WEB_CRAWLER_SOURCES: WebCrawlerSource[] = [
  {
    id: "rayon-oborishte-bg",
    extractorImportPath: "../crawlers/rayon-oborishte-bg/extractors.ts",
  },
  {
    id: "rayon-ilinden-bg",
    extractorImportPath: "../crawlers/rayon-ilinden-bg/extractors.ts",
  },
  {
    id: "rayon-pancharevo-bg",
    extractorImportPath: "../crawlers/rayon-pancharevo-bg/extractors.ts",
  },
  {
    id: "so-slatina-org",
    extractorImportPath: "../crawlers/so-slatina-org/extractors.ts",
  },
  {
    id: "sofia-bg",
    extractorImportPath: "../crawlers/sofia-bg/extractors.ts",
  },
  {
    id: "sredec-sofia-org",
    extractorImportPath: "../crawlers/sredec-sofia-org/extractors.ts",
  },
  {
    id: "studentski-bg",
    extractorImportPath: "../crawlers/studentski-bg/extractors.ts",
  },
  {
    id: "triaditsa-org",
    extractorImportPath: "../crawlers/triaditsa-org/extractors.ts",
  },
];

const API_STYLE_SOURCES = [
  "erm-zapad",
  "nimh-severe-weather",
  "sofiyska-voda",
  "toplo-bg",
] as const;

const SOURCE_JSON_PATH = resolve(process.cwd(), "../web/lib/sources.json");

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function loadSourceUrls(): Promise<Map<string, string>> {
  const raw = await readFile(SOURCE_JSON_PATH, "utf-8");
  const parsed = JSON.parse(raw) as SourceEntry[];
  return new Map(parsed.map((entry) => [entry.id, entry.url]));
}

async function saveEntryScreenshot(page: Page, outputDir: string): Promise<void> {
  await page.screenshot({
    path: resolve(outputDir, "_entry.png"),
    fullPage: true,
  });
}

async function saveMessageScreenshot(page: Page, outputDir: string): Promise<void> {
  await page.screenshot({
    path: resolve(outputDir, "_message.png"),
    fullPage: true,
  });
}

async function captureWebCrawler(
  page: Page,
  sourceId: string,
  sourceUrl: string,
  extractorImportPath: string,
): Promise<void> {
  const outputDir = resolve(process.cwd(), "crawlers", sourceId);
  await mkdir(outputDir, { recursive: true });

  await page.goto(sourceUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await saveEntryScreenshot(page, outputDir);

  const extractorModule = (await import(extractorImportPath)) as {
    extractPostLinks: (page: Page) => Promise<Array<{ url: string }>>;
  };

  const postLinks = await extractorModule.extractPostLinks(page);
  const firstPostUrl = postLinks.find((post) => isHttpUrl(post.url))?.url;

  if (firstPostUrl) {
    await page.goto(firstPostUrl, { waitUntil: "networkidle", timeout: 60_000 });
    await saveMessageScreenshot(page, outputDir);
    return;
  }

  await saveMessageScreenshot(page, outputDir);
}

async function captureApiStyleSource(
  page: Page,
  sourceId: string,
  sourceUrl: string,
): Promise<void> {
  const outputDir = resolve(process.cwd(), "crawlers", sourceId);
  await mkdir(outputDir, { recursive: true });

  await page.goto(sourceUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await saveEntryScreenshot(page, outputDir);
  await saveMessageScreenshot(page, outputDir);
}

async function main(): Promise<void> {
  const sourceUrls = await loadSourceUrls();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 2200 },
    });

    for (const source of WEB_CRAWLER_SOURCES) {
      const sourceUrl = sourceUrls.get(source.id);
      if (!sourceUrl) {
        console.warn(`[skip] Missing URL for ${source.id}`);
        continue;
      }

      console.log(`[capture] ${source.id}`);
      try {
        await captureWebCrawler(
          page,
          source.id,
          sourceUrl,
          source.extractorImportPath,
        );
      } catch (error) {
        console.error(`[error] ${source.id}`, error);
      }
    }

    for (const sourceId of API_STYLE_SOURCES) {
      const sourceUrl = sourceUrls.get(sourceId);
      if (!sourceUrl) {
        console.warn(`[skip] Missing URL for ${sourceId}`);
        continue;
      }

      console.log(`[capture] ${sourceId}`);
      try {
        await captureApiStyleSource(page, sourceId, sourceUrl);
      } catch (error) {
        console.error(`[error] ${sourceId}`, error);
      }
    }

    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
