# Deploy Frontend to Railway

## Quick Setup Steps

### 1. Add New Service in Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"GitHub Repo"**
3. Select the same repository: `therodstu/cvgd`
4. Railway will create a new service

### 2. Configure Frontend Service

In the new service settings:

**Root Directory:**
- Set to: `real-estate-map`

**Build Command:**
- Leave empty (Railway auto-detects `npm run build`)

**Start Command:**
- Leave empty (Railway will use the Procfile: `npx serve -s build -l $PORT`)

### 3. Set Environment Variables

Go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://cvgd-production.up.railway.app` |
| `PORT` | (leave empty - Railway auto-assigns) |

**Important:** Replace `cvgd-production.up.railway.app` with your actual backend URL if different.

### 4. Deploy

Railway will automatically:
1. Install dependencies (`npm install`)
2. Build the React app (`npm run build`)
3. Serve the static files (`npx serve -s build -l $PORT`)
4. Assign a public URL

### 5. Get Your Frontend URL

After deployment:
- Go to service → **Settings** → **Domains**
- Copy your frontend URL (e.g., `https://your-frontend.up.railway.app`)

## How It Works

1. **Build Phase:** Railway runs `npm run build` which creates optimized static files in the `build/` folder
2. **Serve Phase:** Railway runs `npx serve -s build -l $PORT` to serve the static files
3. **Environment Variables:** `REACT_APP_API_URL` is baked into the build at build time, so your frontend knows where to find the backend

## Update Backend CORS (If Needed)

If your frontend URL is different, update the backend CORS in `server.js`:

```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://your-frontend.up.railway.app"  // Add your frontend URL
    ],
    methods: ["GET", "POST"]
  }
});
```

Also update Express CORS if needed:
```javascript
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://your-frontend.up.railway.app"
  ]
}));
```

## Troubleshooting

### Build Fails?
- Check logs in Railway dashboard
- Verify all dependencies are in `package.json`
- Make sure `serve` package is included (already added)

### Frontend Can't Connect to Backend?
- Verify `REACT_APP_API_URL` is set correctly
- Check backend is running and accessible
- Verify CORS settings in backend allow your frontend URL
- Check browser console for errors

### Static Files Not Serving?
- Verify `build/` folder is created during build
- Check that `serve` package is installed
- Verify Procfile or start command is correct

## Both Services Running

Once both are deployed:
- **Backend:** `https://cvgd-production.up.railway.app`
- **Frontend:** `https://your-frontend.up.railway.app`

Your full-stack app is now live! 🚀

