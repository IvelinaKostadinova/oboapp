import { BaseSourceDocument, PostLink } from "../shared/types";

export interface SourceDocument extends BaseSourceDocument {
  sourceType: "burgas-org";
}

export type { PostLink };