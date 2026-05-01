import { describe, it, expect } from "vitest";
import { parseFeedItems, extractContentHtml, parseFeedDate } from "./extractors";

// ---------------------------------------------------------------------------
// Helpers for building minimal RSS XML
// ---------------------------------------------------------------------------
function rssItem({
  title,
  url,
  pubDate,
  contentEncoded,
}: {
  title: string;
  url: string;
  pubDate: string;
  contentEncoded: string;
}): string {
  return `<item>
  <title><![CDATA[${title}]]></title>
  <link>${url}</link>
  <pubDate>${pubDate}</pubDate>
  <content:encoded><![CDATA[${contentEncoded}]]></content:encoded>
</item>`;
}

function rssFeed(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>Новини Архиви - Топлофикация Бургас</title>
  ${items}
</channel>
</rss>`;
}

const OUTAGE_CONTENT = `<div class="elementor-element elementor-element-e446927 elementor-widget-text-editor" data-id="e446927"><div class="elementor-widget-container"><p>Уважаеми клиенти! Уведомяваме ви за авария в к-с Изгрев.</p></div></div>`;

const SCHEDULE_CONTENT = `<div class="elementor-element elementor-element-e446927" data-id="e446927"><div class="elementor-widget-container"><p>График за месец март:</p><div class="table-wrap"><table><tr><td>комплекс Изгрев</td><td>25.03.2026</td></tr></table></div></div></div>`;

// ---------------------------------------------------------------------------
// parseFeedItems
// ---------------------------------------------------------------------------
describe("toplo-burgas-bg/extractors", () => {
  describe("parseFeedItems", () => {
    it("parses title, url, pubDate, and contentEncodedHtml from a single item", () => {
      const xml = rssFeed(
        rssItem({
          title: "Отстраняване на авария в Изгрев",
          url: "https://toplo-bs.com/2026/02/11/outage/",
          pubDate: "Wed, 11 Feb 2026 06:46:03 +0000",
          contentEncoded: OUTAGE_CONTENT,
        }),
      );

      const items = parseFeedItems(xml);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("Отстраняване на авария в Изгрев");
      expect(items[0].url).toBe("https://toplo-bs.com/2026/02/11/outage/");
      expect(items[0].pubDate).toBe("Wed, 11 Feb 2026 06:46:03 +0000");
      expect(items[0].contentEncodedHtml).toBe(OUTAGE_CONTENT);
    });

    it("parses multiple items", () => {
      const xml = rssFeed(
        rssItem({
          title: "Авария 1",
          url: "https://toplo-bs.com/2026/01/01/a/",
          pubDate: "Mon, 01 Jan 2026 10:00:00 +0000",
          contentEncoded: OUTAGE_CONTENT,
        }) +
          rssItem({
            title: "График за март",
            url: "https://toplo-bs.com/2026/03/01/b/",
            pubDate: "Tue, 02 Mar 2026 10:00:00 +0000",
            contentEncoded: SCHEDULE_CONTENT,
          }),
      );

      const items = parseFeedItems(xml);
      expect(items).toHaveLength(2);
      expect(items[1].title).toBe("График за март");
    });

    it("skips items without a URL", () => {
      const itemWithoutUrl = `<item>
  <title><![CDATA[No URL item]]></title>
  <pubDate>Mon, 01 Jan 2026 10:00:00 +0000</pubDate>
</item>`;
      const items = parseFeedItems(rssFeed(itemWithoutUrl));
      expect(items).toHaveLength(0);
    });

    it("returns empty array for empty channel", () => {
      const items = parseFeedItems(rssFeed(""));
      expect(items).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // extractContentHtml
  // ---------------------------------------------------------------------------
  describe("extractContentHtml", () => {
    it("extracts paragraph content from the text-editor widget", () => {
      const result = extractContentHtml(OUTAGE_CONTENT);
      expect(result).toContain("Уважаеми клиенти!");
      expect(result).toContain("авария в к-с Изгрев");
    });

    it("handles nested divs inside the widget container (e.g. schedule tables)", () => {
      const result = extractContentHtml(SCHEDULE_CONTENT);
      expect(result).toContain("График за месец март");
      expect(result).toContain("комплекс Изгрев");
    });

    it("returns empty string when the widget data-id is not found", () => {
      const html =
        '<div data-id="other"><div class="elementor-widget-container"><p>X</p></div></div>';
      expect(extractContentHtml(html)).toBe("");
    });

    it("returns empty string for empty input", () => {
      expect(extractContentHtml("")).toBe("");
    });
  });

  // ---------------------------------------------------------------------------
  // parseFeedDate
  // ---------------------------------------------------------------------------
  describe("parseFeedDate", () => {
    it("converts RFC 2822 pubDate at UTC+0 to ISO 8601", () => {
      const result = parseFeedDate("Thu, 23 Apr 2026 07:09:42 +0000");
      expect(result).toBe("2026-04-23T07:09:42.000Z");
    });

    it("converts RFC 2822 pubDate at UTC+3 to ISO 8601 (adjusts to UTC)", () => {
      const result = parseFeedDate("Mon, 20 Apr 2026 14:38:28 +0300");
      expect(result).toBe("2026-04-20T11:38:28.000Z");
    });
  });
});
