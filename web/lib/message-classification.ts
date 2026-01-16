import type { Message } from "./types";

export type MessageClassification = "active" | "archived";

/**
 * Parse Bulgarian timespan date format "DD.MM.YYYY HH:MM"
 * Returns null if parsing fails
 */
export function parseTimespanDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }

  const regex = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/;
  const parts = regex.exec(dateStr.trim());

  if (!parts) {
    return null;
  }

  const [, day, month, year, hours, minutes] = parts;

  // Validate ranges
  const dayNum = Number.parseInt(day, 10);
  const monthNum = Number.parseInt(month, 10);
  const yearNum = Number.parseInt(year, 10);
  const hoursNum = Number.parseInt(hours, 10);
  const minutesNum = Number.parseInt(minutes, 10);

  if (
    dayNum < 1 ||
    dayNum > 31 ||
    monthNum < 1 ||
    monthNum > 12 ||
    yearNum < 2000 ||
    yearNum > 2100 ||
    hoursNum < 0 ||
    hoursNum > 23 ||
    minutesNum < 0 ||
    minutesNum > 59
  ) {
    return null;
  }

  return new Date(
    yearNum,
    monthNum - 1, // JS months are 0-indexed
    dayNum,
    hoursNum,
    minutesNum
  );
}

/**
 * Get current date in Bulgarian timezone (EET/EEST, UTC+2/+3)
 * Returns a Date object representing "now" in Bulgarian time
 */
export function getTodayBulgarianTime(): Date {
  // Get current time in Bulgarian timezone
  const bulgarianTimeString = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Sofia",
  });

  // Parse the localized string back to a Date object
  return new Date(bulgarianTimeString);
}

/**
 * Check if two dates are on the same day (ignoring time)
 * Both dates should be in the same timezone context
 */
export function isToday(date: Date, referenceDate: Date): boolean {
  if (!date || !referenceDate) {
    return false;
  }

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
}

/**
 * Extract the latest (most recent) timespan end date from a message
 * Returns null if no valid timespans found
 */
export function getLatestTimespanEndDate(message: Message): Date | null {
  if (!message.extractedData) {
    return null;
  }

  const allTimespans: Array<{ end: string }> = [];

  // Collect timespans from pins
  if (message.extractedData.pins && Array.isArray(message.extractedData.pins)) {
    for (const pin of message.extractedData.pins) {
      if (pin.timespans && Array.isArray(pin.timespans)) {
        allTimespans.push(...pin.timespans);
      }
    }
  }

  // Collect timespans from streets
  if (
    message.extractedData.streets &&
    Array.isArray(message.extractedData.streets)
  ) {
    for (const street of message.extractedData.streets) {
      if (street.timespans && Array.isArray(street.timespans)) {
        allTimespans.push(...street.timespans);
      }
    }
  }

  // Parse all end dates and find the latest
  let latestDate: Date | null = null;

  for (const timespan of allTimespans) {
    if (!timespan.end) {
      continue;
    }

    const endDate = parseTimespanDate(timespan.end);
    if (!endDate) {
      continue;
    }

    if (!latestDate || endDate > latestDate) {
      latestDate = endDate;
    }
  }

  return latestDate;
}

/**
 * Classify a message as "active" (today or future) or "archived" (past)
 * Uses Bulgarian timezone for date determination
 *
 * Classification logic:
 * 1. Try to get latest timespan end date from extractedData
 * 2. If found, check if it's today or in the future in Bulgarian time → "active", else "archived"
 * 3. Fallback: use createdAt, check if today → "active", else "archived"
 */
export function classifyMessage(message: Message): MessageClassification {
  const today = getTodayBulgarianTime();

  // Try timespan end dates first
  const latestTimespanEnd = getLatestTimespanEndDate(message);
  if (latestTimespanEnd) {
    // Convert to Bulgarian time for comparison
    const bulgarianTimespanEnd = new Date(
      latestTimespanEnd.toLocaleString("en-US", {
        timeZone: "Europe/Sofia",
      })
    );

    // Check if the timespan ends today or in the future
    return isToday(bulgarianTimespanEnd, today) || bulgarianTimespanEnd > today
      ? "active"
      : "archived";
  }

  // Fallback to createdAt
  if (message.createdAt) {
    const createdDate =
      typeof message.createdAt === "string"
        ? new Date(message.createdAt)
        : message.createdAt;

    // Convert to Bulgarian time for comparison
    const bulgarianCreatedAt = new Date(
      createdDate.toLocaleString("en-US", {
        timeZone: "Europe/Sofia",
      })
    );

    return isToday(bulgarianCreatedAt, today) ? "active" : "archived";
  }

  // Default to archived if no date information available
  return "archived";
}
