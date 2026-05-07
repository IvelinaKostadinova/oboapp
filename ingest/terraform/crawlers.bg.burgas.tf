# Crawlers for the bg.burgas locality (Burgas, Bulgaria).
# To add a new crawler: add an entry here AND register it in shared/src/sources.ts.
# Set emergent = true for crawlers that should run every 30 minutes.

locals {
  crawlers_bg_burgas = {
    burgas = {
      source      = "burgas-bg"
      memory      = "1Gi"
      timeout     = "1800s"
      description = "Crawl Burgas municipality news"
    }
  }
}
