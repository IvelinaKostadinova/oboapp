import { describe, it, expect } from "vitest";
import { verifyEnvSet } from "./verify-env";

describe("verifyEnvSet", () => {
  const KEY = "TEST_VERIFY_ENV_KEY";
  const OTHER = "ANOTHER_MISSING_KEY";

  it("does not throw when keys are present", () => {
    const old = process.env[KEY];
    process.env[KEY] = "1";
    try {
      expect(() => verifyEnvSet([KEY])).not.toThrow();
    } finally {
      if (old === undefined) delete process.env[KEY];
      else process.env[KEY] = old;
    }
  });

  it("throws listing missing keys when absent", () => {
    const old = process.env[KEY];
    delete process.env[KEY];
    try {
      expect(() => verifyEnvSet([KEY, OTHER])).toThrow(
        new RegExp(`Missing required environment variables: .*${KEY}.*${OTHER}`)
      );
    } finally {
      if (old === undefined) delete process.env[KEY];
      else process.env[KEY] = old;
    }
  });
});
