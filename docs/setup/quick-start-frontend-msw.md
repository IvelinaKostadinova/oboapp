# Quick Start: Front-End Development with MSW

This guide is for **front-end developers** who want to work on OboApp's UI without installing Java, Docker, or Firebase emulators.

## Prerequisites

- Node.js 18+ and [pnpm](https://pnpm.io/installation)
- Git

## Setup (5 minutes)

### 1. Install Dependencies

```bash
pnpm install  # Execute in root. Installs dependencies for all modules (web, ingest, shared)
```

### 2. Configure Environment Variables

Copy the MSW environment file and set your Google Maps API key:

```bash
cd web
cp .env.example.msw .env.local
```

Edit `web/.env.local` and fill in:

```bash
# Google Maps API key (required for map display)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here
```

**Note**: For a Google Maps API key, create one at the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview). Enable the Maps JavaScript API and set restrictions for localhost. All other Firebase variables are automatically set to safe demo values in MSW mode.

### 3. Start Development Server

```bash
cd web
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

You should see console logs indicating MSW is active:

```
[MSW] Mock Service Worker started
[Firebase Client] MSW mode enabled - using mock user
```

## What Works in MSW Mode

✅ **Fully Functional**:

- Map display with ~20 pre-generated messages
- Grouped events page (`/events`) with event accordions
- Category filtering
- Viewport-based message filtering
- Interest zone management (create, edit, delete)
- Settings page (displays mock user data)
- Notification history (5 sample notifications)
- All UI components and styling

⚠️ **Limited Functionality**:

- **Authentication**: You're automatically logged in as a mock user. The sign-in button won't trigger Google OAuth.
- **Push notifications**: Subscription API is mocked, but actual browser notifications won't work.
- **Real-time updates**: Messages are static fixtures, not live data from Firebase.

❌ **Not Available**:

- Firebase Cloud Messaging (FCM) - browser push notifications
- Real Google OAuth flow
- Firestore real-time listeners
- Backend crawlers and AI processing

## Mock Data Details

### Messages

- **~20 messages** covering all categories (water, construction, public-transport, etc.)
- **Mixed locations**: Some clustered around city center, others scattered across Sofia
- **Edge cases**: City-wide alerts, messages without GeoJSON, long text, uncategorized messages

### Events

- **7 events** grouping messages into real-world incidents
- **Mix of single-message events** (1:1) and **multi-message events** (2–3 messages each)
- **Event-message links** with confidence scores and match signals

### User State

- **Pre-authenticated user**: `dev@example.com`
- **2 interest zones**:
  - City center (42.6977, 23.3219) - 500m radius
  - Mladost area (42.65, 23.38) - 800m radius
- **2 notification subscriptions**: Desktop + Mobile
- **5 notification history entries**

## Troubleshooting

### "Mock Service Worker not loading"

- Ensure `web/public/mockServiceWorker.js` exists
- Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Check browser console for errors

### "Map not displaying"

- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly
- Check the API key has Maps JavaScript API enabled
- Ensure billing is enabled on Google Cloud project (free tier available)

### "TypeScript errors in **mocks**"

- Run `pnpm install` in the root directory to build shared package
- Restart the TypeScript server in VS Code (Cmd+Shift+P → "TypeScript: Restart TS Server")
