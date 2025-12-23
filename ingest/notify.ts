#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("notify")
  .description(
    "Match unprocessed messages with user interests and send notifications"
  )
  .addHelpText(
    "after",
    `
This command:
  - Fetches all unprocessed messages (where notificationsSent != true)
  - Matches them against all user interests using geospatial calculations
  - Creates notification matches in Firestore
  - Sends push notifications via Firebase Cloud Messaging
  - Marks messages as notified

Examples:
  $ npx tsx notify
`
  )
  .action(async () => {
    try {
      // Dynamically import to avoid loading dependencies at parse time
      const { main } = await import("./notifications/match-and-notify");

      await main();

      process.exit(0);
    } catch (error) {
      console.error("❌ Notification matching failed:", error);
      process.exit(1);
    }
  });

program.parse();
