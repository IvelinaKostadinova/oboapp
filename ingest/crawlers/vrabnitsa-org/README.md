# vrabnitsa-org

Scrapes official news and announcements from the Vrabnitsa district website.

- Source site: `https://vrabnitsa.sofia.bg/aktualno/news`
- Source type: `vrabnitsa-org`
- Locality: `bg.sofia`

## Data Structure

- Listing page: Joomla news grid under `/aktualno/news`
- Post links: article cards linking to `/aktualno/news/{slug}`
- Detail pages: title in `h1.article-title`, date in `time`, content in `div.article-body`

## Notes

- This is a long-flow crawler. It stores raw source documents and relies on the ingest pipeline to classify messages and extract locations.
- The source mixes general news with infrastructure-related notices, so relevance filtering happens downstream in the AI pipeline.