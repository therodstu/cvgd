# Quick Railway Setup via GitHub

## Steps in Railway Dashboard

### 1. Connect Repository
- Go to [railway.app/dashboard](https://railway.app/dashboard)
- Click "New Project" → "Deploy from GitHub repo"
- Select: `therodstu/cvgd`
- Authorize Railway to access your GitHub if prompted

### 2. Configure Backend Service

After Railway imports your repo, configure the service:

**Settings to configure:**
- **Root Directory**: `real-estate-map/backend`
- **Build Command**: (leave empty, Railway auto-detects)
- **Start Command**: `npm start` (auto-detected from package.json)

### 3. Set Environment Variables

Go to your service → **Variables** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `JWT_SECRET` | `[generate a secure random string]` | **Important: Use a strong secret!** |
| `PORT` | (leave empty) | Railway auto-assigns this |

**Generate a secure JWT_SECRET:**
```bash
# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use an online generator: https://randomkeygen.com/

### 4. Deploy

Railway will automatically:
- Detect your Node.js project
- Install dependencies (`npm install`)
- Start your server (`npm start`)
- Assign a public URL

### 5. Get Your Backend URL

After deployment:
- Go to your service → **Settings** → **Domains**
- Railway provides a URL like: `https://your-app.railway.app`
- Copy this URL - you'll need it for the frontend

### 6. Update Frontend API URL (If deploying frontend)

If you deploy the frontend separately:
- Set environment variable: `REACT_APP_API_URL` = `https://your-backend-url.railway.app`

## Important Notes

1. **Database**: SQLite database will be created at `real-estate-map/backend/data/clintonville.db`
   - For production, consider using Railway's PostgreSQL plugin for better persistence

2. **Default Admin**: After first deployment, login with:
   - Email: `admin@clintonville.com`
   - Password: `admin123`
   - **⚠️ Change this password immediately in production!**

3. **Auto-Deploy**: Railway will automatically redeploy when you push to your GitHub repository

## Troubleshooting

- **Check Logs**: Service → **Deployments** → Click on a deployment → View logs
- **Redeploy**: Service → **Deployments** → Click "Redeploy"
- **Environment Variables**: Make sure all required variables are set

## Next Steps

After backend is deployed:
1. Test your API at the Railway-provided URL
2. Deploy frontend (separate service or use Vercel/Netlify)
3. Update frontend `REACT_APP_API_URL` to point to your Railway backend

