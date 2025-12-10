# Railway Volume Setup - Persist Users & Properties

## What Gets Persisted

This volume will save:
- ✅ **All Users** (admin accounts, regular users, etc.)
- ✅ **All Properties/Pinned Locations** (addresses, coordinates, notes, etc.)
- ✅ **All Property Data** (values, zoning, tax info, etc.)

Everything is stored in one SQLite database file: `clintonville.db`

## Quick Setup Steps

### 1. Go to Your Backend Service

1. Railway Dashboard → Your Project
2. Click on your **backend service** (the API service, not frontend)

### 2. Create Volume

1. Click **Settings** tab
2. Scroll to **Volumes** section
3. Click **"Create Volume"** or **"+ New Volume"**

### 3. Configure the Volume

Enter these settings:

**Volume Name:**
```
database-storage
```
(You can use any name you like)

**Mount Path:**
```
/app/data
```

**Important:** This path must match where your database is stored:
- Your code stores DB at: `./data/clintonville.db` (relative to backend)
- Your root directory is: `real-estate-map/backend`
- So in container: `/app/data/clintonville.db` ✅

### 4. Save

1. Click **"Create"** or **"Save"**
2. Railway will automatically redeploy your service
3. The volume is now mounted and ready!

## Verify It's Working

After the redeploy completes:

1. **Create a test user** in your app
2. **Add a test property/pinned location**
3. **Check Railway logs** - you should see database operations
4. **Restart the service** (or wait for next deploy)
5. **Check your app** - the user and property should still be there! ✅

## How It Works

**Before Volume (Data Lost on Restart):**
```
Container Filesystem (temporary)
└── app/
    └── data/
        └── clintonville.db  ❌ Deleted on restart
```

**After Volume (Data Persists):**
```
Persistent Volume (survives forever)
└── clintonville.db  ✅ Always there

Mounted at:
Container Filesystem
└── app/
    └── data/  ← Volume mounted here
        └── clintonville.db  ✅ Points to persistent storage
```

## Troubleshooting

### Data Still Disappearing?

- ✅ Verify volume is created and mounted (check Settings → Volumes)
- ✅ Check that mount path is exactly `/app/data`
- ✅ Verify root directory is `real-estate-map/backend`
- ✅ Check Railway logs for any volume mount errors

### Can't Find Volume Option?

- Make sure you're on the **backend service** (not frontend)
- Volume option is in **Settings** → **Volumes**
- If you don't see it, your Railway plan might need an upgrade

### Database Path Issues?

The database is created automatically at:
- Code path: `./data/clintonville.db` (relative to `backend/` directory)
- Container path: `/app/data/clintonville.db`
- Volume should mount at: `/app/data`

## What Happens Next

Once the volume is set up:
1. ✅ All new users you create will persist
2. ✅ All properties/pinned locations will persist
3. ✅ Data survives service restarts
4. ✅ Data survives code deployments
5. ✅ Data persists until you delete the volume

Your users and properties are now safe! 🎉
