import type { Page } from "playwright";
import type { PostLink } from "./types";
import { SELECTORS } from "./selectors";
import {
  extractPostDetailsGeneric,
  extractPostLinks as extractPostLinksShared,
} from "../shared/extractors";

const RELEVANT_KEYWORDS = [
  "ремонт",
  "ремонтът",
  "извоз",
  "затвор",
  "затвар",
  "движени",
  "организация на движението",
  "транспорт",
  "маршрут",
  "автобус",
  "линия",
  "улиц",
  "бул.",
  "булевард",
  "път",
  "трафик",
  "обход",
  "авари",
  "прекъс",
  "вода",
  "виК",
  "електро",
  "инфраструктур",
] as const;

// NOTE: The construction section index at /bg/novini-stroitelstvo is crawled,
// but its posts are permalinked under /bg/novini/ — not /bg/novini-stroitelstvo/.
// Only pagination links (…/page/N) carry the /bg/novini-stroitelstvo/ path.
const ALLOWED_SECTION_PATHS = [
  "/bg/novini/",
  "/bg/obyavi-i-saobshteniya/",
  "/bg/kulturna-programa/",
  "/bg/sportna-programa/",
  "/bg/programa-na-kulturen-tsentar-morsko-kazino-i-galeriya-georgi-baev/",
] as const;

function normalizeText(value: string): string {
  try {
    return decodeURIComponent(value).toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

function isRelevantPost(post: PostLink): boolean {
  const combinedText = `${normalizeText(post.url)} ${normalizeText(post.title)}`;

  return RELEVANT_KEYWORDS.some((keyword) =>
    combinedText.includes(keyword.toLowerCase()),
  );
}

export async function extractPostLinks(page: Page): Promise<PostLink[]> {
  // Cast a wide allowlist (news, announcements, cultural/sports programmes) then
  // narrow to disruption-relevant posts using RELEVANT_KEYWORDS, because
  // infrastructure notices often appear across multiple Burgas sections.
  const posts = await extractPostLinksShared(
    page,
    SELECTORS,
    (url) =>
      ALLOWED_SECTION_PATHS.some((path) => normalizeText(url).includes(path)),
  );

  return posts.filter(isRelevantPost);
}

export async function extractPostDetails(
  page: Page,
): Promise<{ title: string; dateText: string; contentHtml: string }> {
  return extractPostDetailsGeneric(page, SELECTORS.POST, [
    "script",
    "style",
    ".event-meta",
    ".fb-share-button",
    ".twitter-share-button",
    ".sidebar",
    "a[href*='?pdf=1']",
  ]);
}