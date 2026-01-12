/**
 * verifyEnvSet(keys)
 * Synchronously verifies that each environment variable in `keys` exists on process.env.
 * Throws an Error listing missing keys if any are absent.
 */
export function verifyEnvSet(keys: string[]): void {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length === 0) return;

  const message = `Missing required environment variables: ${missing.join(
    ", "
  )}. These must be set in environment to run this command.`;
  throw new Error(message);
}

export default verifyEnvSet;
