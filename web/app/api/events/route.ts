import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { WhereClause, OrderByClause } from "@oboapp/db";
import {
  toRequiredISOString,
  toOptionalISOString,
} from "@/lib/date-serialization";
import { getLocality } from "@/lib/bounds-utils";
import type { Event } from "@oboapp/shared";

const PAGE_SIZE = 20;
const DEFAULT_RELEVANCE_DAYS = 3;

function getCutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DEFAULT_RELEVANCE_DAYS);
  return cutoff;
}

function recordToEvent(record: Record<string, unknown>): Event {
  return {
    id: record._id as string,
    plainText: record.plainText as string,
    markdownText: record.markdownText as string | undefined,
    geoJson: record.geoJson as Event["geoJson"],
    geometryQuality: (record.geometryQuality as number) ?? 0,
    timespanStart: toOptionalISOString(record.timespanStart, "timespanStart"),
    timespanEnd: toOptionalISOString(record.timespanEnd, "timespanEnd"),
    categories: Array.isArray(record.categories) ? record.categories : [],
    pins: Array.isArray(record.pins) ? record.pins : undefined,
    streets: Array.isArray(record.streets) ? record.streets : undefined,
    cadastralProperties: Array.isArray(record.cadastralProperties)
      ? record.cadastralProperties
      : undefined,
    busStops: Array.isArray(record.busStops) ? record.busStops : undefined,
    sources: Array.isArray(record.sources) ? record.sources : [],
    messageCount: (record.messageCount as number) ?? 1,
    confidence: (record.confidence as number) ?? 0,
    locality: (record.locality as string) ?? "",
    cityWide: (record.cityWide as boolean) || false,
    createdAt: toRequiredISOString(record.createdAt, "createdAt"),
    updatedAt: toRequiredISOString(record.updatedAt, "updatedAt"),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursorUpdatedAt = searchParams.get("cursorUpdatedAt");
    const cursorId = searchParams.get("cursorId");

    if ((cursorUpdatedAt && !cursorId) || (!cursorUpdatedAt && cursorId)) {
      return NextResponse.json(
        {
          error: "Both cursorUpdatedAt and cursorId must be provided together",
        },
        { status: 400 },
      );
    }

    const db = await getDb();
    const locality = getLocality();
    const cutoffDate = getCutoffDate();

    const where: WhereClause[] = [
      { field: "locality", op: "==", value: locality },
      { field: "updatedAt", op: ">=", value: cutoffDate.toISOString() },
    ];

    if (cursorUpdatedAt) {
      const parsed = new Date(cursorUpdatedAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Invalid cursorUpdatedAt parameter" },
          { status: 400 },
        );
      }
    }

    const orderBy: OrderByClause[] = [
      { field: "updatedAt", direction: "desc" },
    ];

    const fetchedDocs = await db.events.findMany({
      where,
      orderBy,
      limit: PAGE_SIZE + 1,
    });

    // Apply cursor filtering in memory (Firestore supports one range filter)
    let filtered = fetchedDocs;
    if (cursorUpdatedAt && cursorId) {
      const cursorTime = new Date(cursorUpdatedAt).getTime();
      filtered = fetchedDocs.filter((doc) => {
        const docTime = new Date(doc.updatedAt as string).getTime();
        if (docTime < cursorTime) return true;
        if (docTime > cursorTime) return false;
        return String(doc._id).localeCompare(cursorId) < 0;
      });
    }

    const hasMore = filtered.length > PAGE_SIZE;
    const pageDocs = filtered.slice(0, PAGE_SIZE);
    const events = pageDocs.map(recordToEvent);

    const lastDoc = pageDocs[pageDocs.length - 1];
    const nextCursor =
      hasMore && lastDoc
        ? {
            updatedAt: toRequiredISOString(lastDoc.updatedAt, "updatedAt"),
            id: String(lastDoc._id),
          }
        : undefined;

    return NextResponse.json({ events, nextCursor });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
