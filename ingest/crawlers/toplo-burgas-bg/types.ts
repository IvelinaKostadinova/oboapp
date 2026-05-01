import { BaseSourceDocument } from "../shared/types";

export interface SourceDocument extends BaseSourceDocument {
  sourceType: "toplo-burgas-bg";
}

export interface FeedItem {
  url: string;
  title: string;
  pubDate: string;
  contentEncodedHtml: string;
}
