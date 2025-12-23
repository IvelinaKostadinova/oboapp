import { adminAuth } from "@/lib/firebase-admin";

/**
 * Helper: Verify authentication token and extract user info
 */
export async function verifyAuthToken(authHeader: string | null): Promise<{
  userId: string;
  userEmail: string | null;
}> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing auth token");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null,
    };
  } catch (error) {
    console.error("Error verifying auth token:", error);
    throw new Error("Invalid auth token");
  }
}
