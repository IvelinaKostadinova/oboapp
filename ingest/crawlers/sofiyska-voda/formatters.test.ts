import { describe, expect, it } from "vitest";
import {
  sanitizeText,
  ensureDate,
  formatDate,
  buildMarkdownMessage,
  buildPlainTextMessage,
} from "./formatters";

describe("sofiyska-voda/formatters", () => {
  describe("sanitizeText", () => {
    it("should remove extra whitespace", () => {
      expect(sanitizeText("  Hello   World  ")).toBe("Hello World");
    });

    it("should handle newlines and tabs", () => {
      expect(sanitizeText("Hello\n\tWorld\t\n  Test")).toBe("Hello World Test");
    });

    it("should return null for empty string", () => {
      expect(sanitizeText("")).toBeNull();
      expect(sanitizeText("   ")).toBeNull();
    });

    it("should return null for null/undefined", () => {
      expect(sanitizeText(null)).toBeNull();
      expect(sanitizeText()).toBeNull();
    });

    it("should preserve single spaces", () => {
      expect(sanitizeText("Normal text here")).toBe("Normal text here");
    });
  });

  describe("ensureDate", () => {
    it("should convert valid timestamp to Date", () => {
      const timestamp = new Date("2025-12-29T10:00:00").getTime();
      const result = ensureDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it("should handle zero timestamp", () => {
      const result = ensureDate(0);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("1970-01-01T00:00:00.000Z");
    });

    it("should return null for null", () => {
      expect(ensureDate(null)).toBeNull();
    });

    it("should return null for undefined", () => {
      expect(ensureDate()).toBeNull();
    });

    it("should return null for invalid timestamp", () => {
      expect(ensureDate(Number.NaN)).toBeNull();
    });
  });

  describe("formatDate", () => {
    it("should format date using default formatter", () => {
      const date = new Date("2025-12-29T14:30:00");
      const result = formatDate(date);
      expect(result).toBeTruthy();
      expect(result).toContain("2025");
      expect(result).toContain("декември");
    });

    it("should format date using custom formatter", () => {
      const date = new Date("2025-12-29T14:30:00");
      const customFormatter = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
      });
      const result = formatDate(date, customFormatter);
      expect(result).toContain("12/29/25");
    });

    it("should return null for null date", () => {
      expect(formatDate(null)).toBeNull();
    });

    it("should return null for undefined date", () => {
      expect(formatDate()).toBeNull();
    });
  });

  describe("buildMarkdownMessage", () => {
    const mockLayer = { name: "Текущи спирания" };
    const mockFormatter = new Intl.DateTimeFormat("bg-BG", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Sofia",
    });

    it("should build message with location and description", () => {
      const attributes = {
        LOCATION: "ж.к. Младост 4",
        DESCRIPTION: "Ремонт на уличен водопровод",
        LASTUPDATE: new Date("2025-12-28T10:58:00").getTime(),
      };

      const result = buildMarkdownMessage(attributes, mockLayer, mockFormatter);

      expect(result).toContain("ж.к. Младост 4");
      expect(result).toContain("Ремонт на уличен водопровод");
      expect(result).toContain("**Категория:** Текущи спирания");
      expect(result).toContain("**Последно обновяване:**");
    });

    it("should use markdown hard line breaks for metadata", () => {
      const attributes = {
        LOCATION: "Test Location",
        ACTIVESTATUS: "In Progress",
        START_: new Date("2025-12-28T12:57:00").getTime(),
        LASTUPDATE: new Date("2025-12-28T10:58:00").getTime(),
      };

      const result = buildMarkdownMessage(attributes, mockLayer, mockFormatter);

      // Metadata should be joined with 2 spaces + newline (markdown hard break)
      expect(result).toContain("  \n");
      expect(result).toContain("**Категория:**");
      expect(result).toContain("**Статус:**");
      expect(result).toContain("**Начало:**");
    });

    it("should include bold labels for all metadata fields", () => {
      const attributes = {
        LOCATION: "Test",
        ACTIVESTATUS: "Active",
        START_: Date.now(),
        ALERTEND: Date.now(),
        LASTUPDATE: Date.now(),
        SOFIADISTRICT: 13,
        CONTACT: "test@example.com",
      };

      const result = buildMarkdownMessage(attributes, mockLayer);

      expect(result).toContain("**Категория:**");
      expect(result).toContain("**Статус:**");
      expect(result).toContain("**Начало:**");
      expect(result).toContain("**Край:**");
      expect(result).toContain("**Последно обновяване:**");
      expect(result).toContain("**Район на СО (ID):**");
      expect(result).toContain("**Контакт:**");
    });

    it("should skip duplicate location and description", () => {
      const attributes = {
        LOCATION: "Same text",
        DESCRIPTION: "Same text",
      };

      const result = buildMarkdownMessage(attributes, mockLayer);
      const occurrences = (result.match(/Same text/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should handle missing optional fields", () => {
      const attributes = {
        LOCATION: "Test Location",
      };

      const result = buildMarkdownMessage(attributes, mockLayer);

      expect(result).toContain("Test Location");
      expect(result).toContain("**Категория:**");
      expect(result).not.toContain("**Статус:**");
      expect(result).not.toContain("**Начало:**");
    });

    it("should separate paragraphs with double newlines", () => {
      const attributes = {
        LOCATION: "Location text",
        DESCRIPTION: "Description text",
        LASTUPDATE: Date.now(),
      };

      const result = buildMarkdownMessage(attributes, mockLayer);

      // Location and description should be separate paragraphs
      expect(result).toContain("Location text\n\n");
      expect(result).toContain("Description text\n\n");
    });

    it("should sanitize location and description", () => {
      const attributes = {
        LOCATION: "  Multiple   Spaces  ",
        DESCRIPTION: "Extra\n\tWhitespace",
      };

      const result = buildMarkdownMessage(attributes, mockLayer);

      expect(result).toContain("Multiple Spaces");
      expect(result).toContain("Extra Whitespace");
    });
  });

  describe("buildPlainTextMessage", () => {
    const mockLayer = { name: "Текущи спирания" };

    it("should build plain text without markdown formatting", () => {
      const attributes = {
        LOCATION: "ж.к. Младост 4",
        DESCRIPTION: "Ремонт на уличен водопровод",
        LASTUPDATE: new Date("2025-12-28T10:58:00").getTime(),
        ACTIVESTATUS: "In Progress",
      };

      const result = buildPlainTextMessage(attributes, mockLayer);

      expect(result).not.toContain("**");
      expect(result).toContain("ж.к. Младост 4");
      expect(result).toContain("Ремонт на уличен водопровод");
      expect(result).toContain("Категория: Текущи спирания");
      expect(result).toContain("Статус: In Progress");
    });

    it("should not use markdown hard line breaks", () => {
      const attributes = {
        LOCATION: "Test",
        ACTIVESTATUS: "Active",
        LASTUPDATE: Date.now(),
      };

      const result = buildPlainTextMessage(attributes, mockLayer);

      expect(result).not.toContain("  \n");
      expect(result).not.toContain("**");
    });

    it("should include all metadata labels without bold", () => {
      const attributes = {
        LOCATION: "Test",
        ACTIVESTATUS: "Active",
        START_: Date.now(),
        ALERTEND: Date.now(),
        LASTUPDATE: Date.now(),
        SOFIADISTRICT: 13,
        CONTACT: "test@example.com",
      };

      const result = buildPlainTextMessage(attributes, mockLayer);

      expect(result).toContain("Категория:");
      expect(result).toContain("Статус:");
      expect(result).toContain("Начало:");
      expect(result).toContain("Край:");
      expect(result).toContain("Последно обновяване:");
      expect(result).toContain("Район на СО (ID):");
      expect(result).toContain("Контакт:");
    });
  });
});
