/**
 * WordPress RSS feed for all posts (includes аварии + новини categories).
 * Returns valid RSS XML with <content:encoded> — no Playwright needed.
 */
export const FEED_URL = "https://toplo-bs.com/?cat=6&feed=rss2";

/**
 * Stable Elementor widget data-id for the text-editor widget containing
 * the main post body. Verified consistently across all post types in
 * the Топлофикация Бургас WordPress site.
 */
export const TEXT_WIDGET_DATA_ID = "e446927";
