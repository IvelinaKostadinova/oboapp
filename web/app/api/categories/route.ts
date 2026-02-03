import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { CATEGORIES } from "@/lib/category-constants";

/**
 * GET /api/categories
 *
 * Returns list of categories that exist in the database (have at least one finalized message).
 * Reads from pre-computed aggregation document (1 read) instead of scanning all messages.
 * Falls back to full scan if aggregation document doesn't exist yet.
 *
 * Response: { categories: string[] }
 */
export async function GET() {
  try {
    // Read from aggregation document (1 read instead of N)
    const aggregationDoc = await adminDb.doc("aggregations/categoryStats").get();

    if (aggregationDoc.exists) {
      const data = aggregationDoc.data();
      const categories = ((data?.categories as string[]) || []).filter(
        (c) =>
          c === "uncategorized" ||
          CATEGORIES.includes(c as (typeof CATEGORIES)[number]),
      );
      return NextResponse.json({ categories });
    }

    // Fallback to full scan if aggregation doesn't exist yet
    // (runs once before migration, or if aggregation doc is deleted)
    const messagesRef = adminDb.collection("messages");
    const snapshot = await messagesRef.where("finalizedAt", "!=", null).get();

    const categorySet = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const categories = data.categories;

      if (
        !categories ||
        !Array.isArray(categories) ||
        categories.length === 0
      ) {
        categorySet.add("uncategorized");
      } else {
        for (const category of categories) {
          if (CATEGORIES.includes(category)) {
            categorySet.add(category);
          }
        }
      }
    });

    return NextResponse.json({ categories: Array.from(categorySet) });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
