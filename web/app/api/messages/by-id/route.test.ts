import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockFindById = vi.fn();
const mockFindBySourceDocumentIds = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockImplementation(async () => ({
    messages: {
      findById: (...args: unknown[]) => mockFindById(...args),
      findBySourceDocumentIds: (...args: unknown[]) =>
        mockFindBySourceDocumentIds(...args),
    },
  })),
}));

const sampleRecord = {
  _id: "aB3xYz12",
  text: "Test message",
  locality: "sofia",
  source: "sofia-bg",
  createdAt: new Date("2026-01-01T10:00:00Z"),
  categories: ["water"],
  addresses: [],
  geoJson: null,
};

describe("GET /api/messages/by-id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when id parameter is missing", async () => {
    const request = new Request("http://localhost/api/messages/by-id");
    const response = await GET(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Missing id");
  });

  it("returns 200 for a valid 8-char message ID", async () => {
    mockFindById.mockResolvedValue(sampleRecord);
    const request = new Request(
      "http://localhost/api/messages/by-id?id=aB3xYz12",
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message.id).toBe("aB3xYz12");
    expect(mockFindById).toHaveBeenCalledWith("aB3xYz12");
    expect(mockFindBySourceDocumentIds).not.toHaveBeenCalled();
  });

  it("returns 404 when 8-char ID is not found", async () => {
    mockFindById.mockResolvedValue(null);
    const request = new Request(
      "http://localhost/api/messages/by-id?id=zZzZzZzZ",
    );
    const response = await GET(request);
    expect(response.status).toBe(404);
    expect(mockFindBySourceDocumentIds).not.toHaveBeenCalled();
  });

  it("falls back to sourceDocumentId lookup for non-standard IDs", async () => {
    mockFindBySourceDocumentIds.mockResolvedValue([sampleRecord]);
    const sourceDocId = "aHR0cHM6Ly9zby1zbGF0aW5hLm9yZy9wb3N0LzEyMw__";
    const request = new Request(
      `http://localhost/api/messages/by-id?id=${encodeURIComponent(sourceDocId)}-1`,
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message.id).toBe("aB3xYz12");
    expect(mockFindById).not.toHaveBeenCalled();
    expect(mockFindBySourceDocumentIds).toHaveBeenCalledWith([sourceDocId]);
  });

  it("strips split-index suffix before sourceDocumentId lookup", async () => {
    mockFindBySourceDocumentIds.mockResolvedValue([sampleRecord]);
    const request = new Request(
      "http://localhost/api/messages/by-id?id=someBase64EncodedId-2",
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockFindBySourceDocumentIds).toHaveBeenCalledWith([
      "someBase64EncodedId",
    ]);
  });

  it("passes full ID when there is no split-index suffix", async () => {
    mockFindBySourceDocumentIds.mockResolvedValue([sampleRecord]);
    const request = new Request(
      "http://localhost/api/messages/by-id?id=aLongSourceDocumentIdWithoutSuffix",
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockFindBySourceDocumentIds).toHaveBeenCalledWith([
      "aLongSourceDocumentIdWithoutSuffix",
    ]);
  });

  it("returns 404 when sourceDocumentId lookup finds nothing", async () => {
    mockFindBySourceDocumentIds.mockResolvedValue([]);
    const request = new Request(
      "http://localhost/api/messages/by-id?id=nonexistentSourceDoc-1",
    );
    const response = await GET(request);
    expect(response.status).toBe(404);
  });

  it("returns 500 on unexpected errors", async () => {
    mockFindById.mockRejectedValue(new Error("DB connection failed"));
    const request = new Request(
      "http://localhost/api/messages/by-id?id=aB3xYz12",
    );
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
