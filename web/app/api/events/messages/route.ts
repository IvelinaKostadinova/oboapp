import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recordToMessage } from "@/lib/doc-to-message";
import { toRequiredISOString } from "@/lib/date-serialization";
import type { EventMessage } from "@oboapp/shared";

function recordToEventMessage(record: Record<string, unknown>): EventMessage {
  return {
    id: record._id as string,
    eventId: record.eventId as string,
    messageId: record.messageId as string,
    source: record.source as string,
    confidence: (record.confidence as number) ?? 0,
    geometryQuality: (record.geometryQuality as number) ?? 0,
    matchSignals: record.matchSignals as EventMessage["matchSignals"],
    createdAt: toRequiredISOString(record.createdAt, "createdAt"),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId query parameter is required" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Fetch event-message links
    const eventMessageDocs = await db.eventMessages.findByEventId(eventId);

    if (eventMessageDocs.length === 0) {
      return NextResponse.json({ messages: [], eventMessages: [] });
    }

    // Batch fetch messages
    const messagePromises = eventMessageDocs.map((em) =>
      db.messages.findById(em.messageId as string),
    );
    const messageRecords = await Promise.all(messagePromises);

    // Filter out nulls (deleted messages) and convert
    const messages = messageRecords
      .filter((r): r is Record<string, unknown> => r !== null)
      .map(recordToMessage);

    const eventMessages = eventMessageDocs.map(recordToEventMessage);

    return NextResponse.json({ messages, eventMessages });
  } catch (error) {
    console.error("Error fetching event messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch event messages" },
      { status: 500 },
    );
  }
}
