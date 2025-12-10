# Railway Database Persistence Fix

## The Problem

SQLite database files are stored in the filesystem, which is **ephemeral** on Railway. When your service restarts or redeploys, the database file is lost.

## Solution Options

### Option 1: Use Railway Volume (Recommended for SQLite)

1. **Go to Railway Dashboard**
   - Navigate to your backend service
   - Go to **Settings** tab
   - Scroll to **Volumes** section

2. **Create a Volume**
   - Click **"Create Volume"**
   - Name it: `database-storage`
   - Mount path: `/app/data` (or `/app/real-estate-map/backend/data`)

3. **Update Railway Configuration**
   - The database path should match the volume mount point
   - Current path: `real-estate-map/backend/data/clintonville.db`
   - Volume should mount to: `real-estate-map/backend/data/`

### Option 2: Migrate to PostgreSQL (Best for Production)

Railway provides PostgreSQL as a managed service with automatic persistence.

1. **Add PostgreSQL to Your Project**
   - Railway Dashboard → Your Project
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will create a PostgreSQL instance

2. **Get Connection String**
   - Go to PostgreSQL service → **Variables**
   - Copy the `DATABASE_URL` connection string

3. **Update Backend to Use PostgreSQL**
   - Install: `npm install pg`
   - Update `db.js` to use PostgreSQL instead of SQLite
   - Set `DATABASE_URL` environment variable in backend service

### Option 3: Quick Fix - Use Railway Volume for SQLite

**Steps:**

1. **In Railway Dashboard:**
   - Backend service → **Settings** → **Volumes**
   - Click **"Create Volume"**
   - Name: `db-storage`
   - Mount Path: `/app/data`

2. **Update Database Path (if needed):**
   - The database is already at `backend/data/clintonville.db`
   - Make sure the volume mounts to include this path

3. **Redeploy:**
   - Railway will automatically use the volume on next deploy

## Current Database Location

The database is stored at:
```
real-estate-map/backend/data/clintonville.db
```

## Verify Persistence

After setting up a volume:
1. Create a test user
2. Restart the service (or wait for a redeploy)
3. Check if the user still exists

## Recommended: PostgreSQL Migration

For production, PostgreSQL is recommended because:
- ✅ Automatic backups
- ✅ Better performance
- ✅ Handles concurrent connections
- ✅ Built-in persistence
- ✅ Easy scaling

Would you like me to help migrate to PostgreSQL?

