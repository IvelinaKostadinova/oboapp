import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Step 1: Store the incoming message in the database
 */
export async function storeIncomingMessage(
  text: string,
  userId: string,
  userEmail: string | null,
  source: string = "web-interface",
  sourceUrl?: string,
  crawledAt?: Date
): Promise<string> {
  const messagesRef = adminDb.collection("messages");
  const docData: any = {
    text,
    userId,
    userEmail,
    source,
    createdAt: FieldValue.serverTimestamp(),
    crawledAt: crawledAt || FieldValue.serverTimestamp(),
  };

  if (sourceUrl) {
    docData.sourceUrl = sourceUrl;
  }

  const docRef = await messagesRef.add(docData);
  return docRef.id;
}
