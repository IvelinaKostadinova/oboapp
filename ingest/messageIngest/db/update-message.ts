import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { processFieldsForFirestore } from "./process-fields";

/**
 * Update message document with multiple fields atomically
 * @param messageId - The message document ID
 * @param fields - Object containing fields to update
 */
export async function updateMessage(
  messageId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const messagesRef = adminDb.collection("messages");
  const processedFields = processFieldsForFirestore(fields);
  await messagesRef.doc(messageId).update(processedFields);

  // If finalizing a message, update category aggregation
  if (fields.finalizedAt) {
    await updateCategoryAggregationForMessage(messageId);
  }
}

/**
 * Update the category aggregation document when a message is finalized.
 * This maintains a pre-computed list of categories to avoid scanning
 * all messages on every page load.
 */
async function updateCategoryAggregationForMessage(
  messageId: string,
): Promise<void> {
  // Read the message to get its categories
  const messageDoc = await adminDb.collection("messages").doc(messageId).get();
  const messageData = messageDoc.data();

  if (!messageData) return;

  let categories: string[] = messageData.categories;

  // Handle uncategorized messages
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    categories = ["uncategorized"];
  }

  const aggregationRef = adminDb.doc("aggregations/categoryStats");
  await aggregationRef.set(
    {
      categories: FieldValue.arrayUnion(...categories),
      lastUpdated: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
