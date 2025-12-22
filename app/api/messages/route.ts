import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Message, Timespan } from "@/lib/types";
import {
  verifyAuthToken,
  validateMessageText,
  messageIngest,
} from "@/lib/messageIngest";
import {
  loadOborichteBoundary,
  isWithinBoundaries,
} from "@/lib/boundary-utils";

const INGEST_SOURCE = "web-interface";
const DEFAULT_RELEVANCE_DAYS = 7;

function convertTimestamp(timestamp: any): string {
  // Handle Firestore Timestamp from Admin SDK
  if (timestamp?._seconds) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  // Handle Firestore Timestamp from client SDK
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp || new Date().toISOString();
}

/**
 * Parse a timespan end date string in format "DD.MM.YYYY HH:MM" to Date object
 */
function parseTimespanDate(dateStr: string): Date | null {
  try {
    // Expected format: "DD.MM.YYYY HH:MM"
    const regex = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/;
    const parts = regex.exec(dateStr);
    if (!parts) return null;

    const [, day, month, year, hours, minutes] = parts;
    return new Date(
      Number.parseInt(year),
      Number.parseInt(month) - 1, // JS months are 0-indexed
      Number.parseInt(day),
      Number.parseInt(hours),
      Number.parseInt(minutes)
    );
  } catch {
    return null;
  }
}

/**
 * Check if a message is still relevant based on its timespans or creation date
 */
function isMessageRelevant(message: Message, cutoffDate: Date): boolean {
  // If message has extracted data with timespans, check them
  if (message.extractedData) {
    const extractedData = message.extractedData;
    const allTimespans: Timespan[] = [];

    // Collect all timespans from pins
    if (extractedData.pins) {
      extractedData.pins.forEach((pin) => {
        if (pin.timespans && Array.isArray(pin.timespans)) {
          allTimespans.push(...pin.timespans);
        }
      });
    }

    // Collect all timespans from streets
    if (extractedData.streets) {
      extractedData.streets.forEach((street) => {
        if (street.timespans && Array.isArray(street.timespans)) {
          allTimespans.push(...street.timespans);
        }
      });
    }

    // If we have timespans, check if any end date is after cutoff
    if (allTimespans.length > 0) {
      return allTimespans.some((timespan) => {
        if (!timespan.end) return false;
        const endDate = parseTimespanDate(timespan.end);
        return endDate && endDate >= cutoffDate;
      });
    }
  }

  // No timespans found - use createdAt date
  const createdAt = new Date(message.createdAt);
  return createdAt >= cutoffDate;
}

export async function GET() {
  try {
    // Get relevance period from environment
    const relevanceDays = process.env.MESSAGE_RELEVANCE_DAYS
      ? Number.parseInt(process.env.MESSAGE_RELEVANCE_DAYS, 10)
      : DEFAULT_RELEVANCE_DAYS;

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - relevanceDays);

    // Use Admin SDK for reading messages
    const messagesRef = adminDb.collection("messages");
    const snapshot = await messagesRef.orderBy("createdAt", "desc").get();

    const allMessages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      allMessages.push({
        id: doc.id,
        text: data.text,
        addresses: data.addresses ? JSON.parse(data.addresses) : [],
        extractedData: data.extractedData
          ? JSON.parse(data.extractedData)
          : undefined,
        geoJson: data.geoJson ? JSON.parse(data.geoJson) : undefined,
        createdAt: convertTimestamp(data.createdAt),
        source: data.source,
        sourceUrl: data.sourceUrl,
      });
    });

    // Filter messages by relevance
    const relevantMessages = allMessages.filter((message) =>
      isMessageRelevant(message, cutoffDate)
    );

    // Filter messages by Oborishte boundary
    const boundary = loadOborichteBoundary();
    const messages = relevantMessages.filter((message) => {
      if (!message.geoJson) {
        return false; // Exclude messages without GeoJSON
      }
      const geoJson =
        typeof message.geoJson === "string"
          ? JSON.parse(message.geoJson)
          : message.geoJson;
      return isWithinBoundaries(geoJson, boundary);
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get("authorization");
    const { userId, userEmail } = await verifyAuthToken(authHeader);

    // Authorization - restrict to specific user (temporary)
    if (userEmail !== "valery.buchinsky@gmail.com") {
      return NextResponse.json(
        { error: "Unauthorized - Access restricted" },
        { status: 403 }
      );
    }

    // Parse and validate request
    const { text } = await request.json();
    validateMessageText(text);

    // Execute the pipeline
    const newMessage = await messageIngest(
      text,
      INGEST_SOURCE,
      userId,
      userEmail
    );

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);

    // Handle specific error types
    if (
      error instanceof Error &&
      (error.message === "Missing auth token" ||
        error.message === "Invalid auth token")
    ) {
      return NextResponse.json(
        { error: `Unauthorized - ${error.message}` },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      (error.message === "Invalid message text" ||
        error.message.includes("Message text is too long"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes("Failed to geocode")) {
      return NextResponse.json(
        {
          error: "Failed to geocode some addresses",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
