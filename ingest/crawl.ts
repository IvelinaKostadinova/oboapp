#!/usr/bin/env node

import { Command } from "commander";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const program = new Command();

/**
 * Get available crawler sources by reading the crawlers directory
 */
function getAvailableSources(): string[] {
  const crawlersDir = join(__dirname, "crawlers");
  const entries = readdirSync(crawlersDir);

  return entries.filter((entry) => {
    const fullPath = join(crawlersDir, entry);
    const isDirectory = statSync(fullPath).isDirectory();
    // Exclude 'shared' and 'README.md'
    return isDirectory && entry !== "shared";
  });
}

program
  .name("crawl")
  .description("Run a web crawler to fetch data from external sources")
  .requiredOption("-s, --source <name>", "Source crawler to run")
  .addHelpText(
    "after",
    `
Available sources:
${getAvailableSources()
  .map((source) => `  - ${source}`)
  .join("\n")}

Examples:
  $ npx tsx crawl --source rayon-oborishte-bg
  $ npx tsx crawl --source sofia-bg
`
  )
  .action(async (options) => {
    const availableSources = getAvailableSources();

    // Validate source
    if (!availableSources.includes(options.source)) {
      console.error(`❌ Error: Unknown source "${options.source}"`);
      console.error(`\nAvailable sources: ${availableSources.join(", ")}`);
      process.exit(1);
    }

    // Dynamically import and run the crawler
    try {
      const crawlerPath = `./crawlers/${options.source}/index.js`;
      console.log(`🚀 Running crawler: ${options.source}`);

      const crawler = await import(crawlerPath);
      await crawler.crawl();

      console.log(`✅ Crawler ${options.source} completed`);
      process.exit(0);
    } catch (error) {
      console.error(`❌ Error running crawler ${options.source}:`, error);
      process.exit(1);
    }
  });

program.parse();
