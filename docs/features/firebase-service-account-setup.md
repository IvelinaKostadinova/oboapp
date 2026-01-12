# Firebase Service Account Setup

## Overview

Firebase service account keys provide server-side authentication for Firebase Admin SDK operations across different project instances. **Core Behavior**: When deploying the application to multiple environments (development, staging, production), each instance requires its own service account key with appropriate permissions for Firebase operations.

## Creating Service Account Keys

### Google Cloud Console Method

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Configure service account:
   - **Name**: `firebase-admin-[environment]` (e.g., `firebase-admin-staging`)
   - **Description**: Service account for Firebase Admin SDK operations
6. Assign required roles:
   - **Cloud Datastore User** (for Firestore access)
   - **Firebase Cloud Messaging Admin** (for push notifications)
7. Generate private key:
   - Click on the service account email
   - Go to **Keys** tab → **Add Key** → **Create New Key**
   - Select **JSON** format
   - Download the generated key file

## Configuration

### Environment Variable Format

Convert the downloaded JSON key to a single-line string for the environment variable:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
```
