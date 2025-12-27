import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/verifyAuthToken";

// GET - Fetch notification count for the user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { userId } = await verifyAuthToken(authHeader);

    const matchesRef = adminDb.collection("notificationMatches");
    const snapshot = await matchesRef
      .where("userId", "==", userId)
      .where("notified", "==", true)
      .get();

    return NextResponse.json({ count: snapshot.size });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}
