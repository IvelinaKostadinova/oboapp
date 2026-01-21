import { describe, it, expect } from "vitest";

// Import helper functions for testing (they'll be exported from the service)
// For now, we'll test them as if they were exported
// You can export them from the service file or test them indirectly

describe("overpass-geocoding-service", () => {
  describe("parseOverpassError", () => {
    // Helper function copied for testing
    function parseOverpassError(responseText: string): string | null {
      const remarkMatch = /<remark>\s*([\s\S]+?)\s*<\/remark>/.exec(
        responseText,
      );
      if (remarkMatch) {
        return remarkMatch[1].trim();
      }
      return null;
    }

    it("should extract error message from XML remark tag", () => {
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?><remark>Error: Query timed out after 25 seconds</remark>';
      expect(parseOverpassError(xml)).toBe(
        "Error: Query timed out after 25 seconds",
      );
    });

    it("should handle multi-line error messages", () => {
      const xml = `<?xml version="1.0"?>
<remark>
  Error: Query syntax error at line 3
  Expected identifier
</remark>`;
      expect(parseOverpassError(xml)).toBe(
        "Error: Query syntax error at line 3\n  Expected identifier",
      );
    });

    it("should trim whitespace from error messages", () => {
      const xml = "<remark>   Error: timeout   </remark>";
      expect(parseOverpassError(xml)).toBe("Error: timeout");
    });

    it("should return null for non-error responses", () => {
      const json = '{"elements":[{"type":"way","id":123}]}';
      expect(parseOverpassError(json)).toBe(null);
    });

    it("should return null for empty string", () => {
      expect(parseOverpassError("")).toBe(null);
    });

    it("should handle XML without remark tag", () => {
      const xml =
        '<?xml version="1.0"?><osm version="0.6"><note>Some note</note></osm>';
      expect(parseOverpassError(xml)).toBe(null);
    });
  });

  describe("shouldTryFallback", () => {
    // Helper function copied for testing
    function shouldTryFallback(error: Error, statusCode?: number): boolean {
      const msg = error.message.toLowerCase();

      // Client-side errors (our fault) - don't retry
      if (
        msg.includes("syntax") ||
        msg.includes("parse error") ||
        msg.includes("expected") ||
        msg.includes("unexpected") ||
        msg.includes("invalid")
      ) {
        return false;
      }

      // HTTP 4xx = client error (except 429 Too Many Requests)
      if (
        statusCode &&
        statusCode >= 400 &&
        statusCode < 500 &&
        statusCode !== 429
      ) {
        return false;
      }

      // All other errors = server-side, should retry
      return true;
    }

    describe("client-side errors (should NOT retry)", () => {
      it("should not retry on syntax errors", () => {
        const error = new Error("Query syntax error at line 3");
        expect(shouldTryFallback(error)).toBe(false);
      });

      it("should not retry on parse errors", () => {
        const error = new Error("Parse error: unexpected token");
        expect(shouldTryFallback(error)).toBe(false);
      });

      it("should not retry on expected keyword errors", () => {
        const error = new Error("Expected identifier, got symbol");
        expect(shouldTryFallback(error)).toBe(false);
      });

      it("should not retry on unexpected keyword errors", () => {
        const error = new Error("Unexpected end of query");
        expect(shouldTryFallback(error)).toBe(false);
      });

      it("should not retry on invalid errors", () => {
        const error = new Error("Invalid coordinates provided");
        expect(shouldTryFallback(error)).toBe(false);
      });

      it("should not retry on HTTP 400 errors", () => {
        const error = new Error("Bad Request");
        expect(shouldTryFallback(error, 400)).toBe(false);
      });

      it("should not retry on HTTP 404 errors", () => {
        const error = new Error("Not Found");
        expect(shouldTryFallback(error, 404)).toBe(false);
      });
    });

    describe("server-side errors (SHOULD retry)", () => {
      it("should retry on timeout errors", () => {
        const error = new Error("Query timed out after 25 seconds");
        expect(shouldTryFallback(error)).toBe(true);
      });

      it("should retry on network errors", () => {
        const error = new Error("Network request failed");
        expect(shouldTryFallback(error)).toBe(true);
      });

      it("should retry on AbortError", () => {
        const error = new Error("The operation was aborted");
        error.name = "AbortError";
        expect(shouldTryFallback(error)).toBe(true);
      });

      it("should retry on server overload", () => {
        const error = new Error("Server is busy, please try again");
        expect(shouldTryFallback(error)).toBe(true);
      });

      it("should retry on HTTP 429 (rate limit)", () => {
        const error = new Error("Too Many Requests");
        expect(shouldTryFallback(error, 429)).toBe(true);
      });

      it("should retry on HTTP 500 errors", () => {
        const error = new Error("Internal Server Error");
        expect(shouldTryFallback(error, 500)).toBe(true);
      });

      it("should retry on HTTP 503 errors", () => {
        const error = new Error("Service Unavailable");
        expect(shouldTryFallback(error, 503)).toBe(true);
      });

      it("should retry on generic errors without status code", () => {
        const error = new Error("Something went wrong");
        expect(shouldTryFallback(error)).toBe(true);
      });
    });

    describe("case insensitivity", () => {
      it("should detect SYNTAX errors in uppercase", () => {
        const error = new Error("SYNTAX ERROR AT LINE 5");
        expect(shouldTryFallback(error)).toBe(false);
      });

      it("should detect Invalid errors in mixed case", () => {
        const error = new Error("Invalid Query Structure");
        expect(shouldTryFallback(error)).toBe(false);
      });
    });
  });
});
