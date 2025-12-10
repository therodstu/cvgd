# Frontend Setup with Railway Backend

Your backend is now deployed at: **https://cvgd-production.up.railway.app**

## Local Development Setup

### Option 1: Use Railway Backend (Recommended)

1. Create a `.env` file in the `real-estate-map` directory:

```bash
cd real-estate-map
```

2. Create `.env` file with:
```
REACT_APP_API_URL=https://cvgd-production.up.railway.app
```

3. Start the frontend:
```bash
npm start
```

The frontend will now connect to your Railway backend!

### Option 2: Use Local Backend

If you want to use a local backend for development:

1. Create `.env` file with:
```
REACT_APP_API_URL=http://localhost:5000
```

2. Make sure your local backend is running on port 5000

## Testing Your Backend

### Test API Endpoint
Open in browser: https://cvgd-production.up.railway.app/api/properties

Should return: `[]` (empty array) or your properties list

### Test Admin Login
You can test the login endpoint using PowerShell:

```powershell
$body = @{
    email = "admin@clintonville.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://cvgd-production.up.railway.app/api/auth/login" -Method POST -ContentType "application/json" -Body $body
```

## Frontend Deployment

When deploying the frontend (Vercel, Netlify, etc.):

1. Set environment variable:
   - `REACT_APP_API_URL` = `https://cvgd-production.up.railway.app`

2. The frontend will automatically use this URL in production

## CORS Configuration

Your backend already has CORS enabled, so it should accept requests from:
- `http://localhost:3000` (local development)
- Your frontend deployment domain (when deployed)

If you need to add specific domains, update `server.js`:
```javascript
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3001", "https://your-frontend-domain.com"],
    methods: ["GET", "POST"]
  }
});
```

## Troubleshooting

### Frontend can't connect to backend?
- Check that `REACT_APP_API_URL` is set correctly
- Verify the Railway backend is running (check Railway dashboard)
- Check browser console for CORS errors
- Make sure you're using `https://` not `http://` for Railway URL

### Backend not responding?
- Check Railway logs: Dashboard → Service → Deployments → Logs
- Verify environment variables are set in Railway
- Check if service is active in Railway dashboard

