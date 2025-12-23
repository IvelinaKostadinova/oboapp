import { GeoJSONFeatureCollection } from "../../types";

export interface SofiyskaVodaSourceDocument {
  url: string;
  datePublished: string; // ISO format
  title: string;
  message: string; // Markdown text that feeds the ingest pipeline
  sourceType: "sofiyska-voda";
  crawledAt: Date;
  geoJson: GeoJSONFeatureCollection;
}

export interface ArcGisFeature {
  attributes?: ArcGisAttributes;
  geometry?: ArcGisGeometry | null;
}

export interface ArcGisGeometry {
  rings?: number[][][];
  paths?: number[][][];
  x?: number;
  y?: number;
}

export interface ArcGisAttributes {
  OBJECTID?: number;
  ALERTID?: string | null;
  ALERTTYPE?: string | null;
  START_?: number | null;
  DESCRIPTION?: string | null;
  CONTACT?: string | null;
  LASTUPDATE?: number | null;
  LASTEDITOR?: string | null;
  ALERTEND?: number | null;
  SOFIADISTRICT?: number | null;
  LOCATION?: string | null;
  ACTIVESTATUS?: string | null;
  START_H?: string | null;
  START_M?: string | null;
  END_H?: string | null;
  END_M?: string | null;
  CREATEDBY?: string | null;
  CREATEDON?: number | null;
  PUBLICITY?: number | null;
  wsi_created_user?: string | null;
  wsi_last_edited_user?: string | null;
}

export interface ArcGisQueryResponse {
  features?: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  error?: {
    code: number;
    message: string;
    details?: string[];
  };
}

export interface LayerConfig {
  id: number;
  name: string;
  where?: string;
  titlePrefix: string;
}
