# Railway Deployment Guide

This guide will help you deploy the Clintonville Real Estate Map to Railway.

## Prerequisites

1. Railway CLI installed: `npm install -g @railway/cli`
2. Railway account created at [railway.app](https://railway.app)

## Deployment Steps (GitHub Connection Method)

### 1. Connect GitHub Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" or select your existing project
3. Choose "Deploy from GitHub repo"
4. Select your repository: `therodstu/cvgd`
5. Railway will automatically detect your project structure

### 2. Configure Service Settings

Since this is a monorepo, you'll need to configure Railway to deploy the backend:

1. In your Railway project, go to the service settings
2. Set the **Root Directory** to: `real-estate-map/backend`
3. Railway will auto-detect Node.js and use the `package.json` in that directory
4. The start command will be: `npm start` (from `package.json`)

### 3. Set Environment Variables

Set the required environment variables in Railway:

```bash
railway variables set PORT=5000
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secure-secret-key-here
```

Or set them via the Railway dashboard:
- Go to your project → Variables tab
- Add the following variables:
  - `PORT` = `5000` (or let Railway auto-assign)
  - `NODE_ENV` = `production`
  - `JWT_SECRET` = (generate a secure random string)

### 4. Deploy Backend

From the backend directory:

```bash
cd real-estate-map/backend
railway up
```

Or from the root directory:

```bash
railway up --service backend
```

### 5. Get Your Backend URL

After deployment, Railway will provide a URL. Get it with:

```bash
railway domain
```

Or check the Railway dashboard for your service URL.

### 6. Deploy Frontend (Optional - Static Site)

For the frontend, you have two options:

#### Option A: Deploy as Static Site (Recommended)
1. Build the frontend locally:
   ```bash
   cd real-estate-map
   npm run build
   ```

2. Deploy the `build` folder to Railway Static or another service like Vercel/Netlify

3. Set environment variable in frontend:
   - `REACT_APP_API_URL` = (your Railway backend URL)

#### Option B: Deploy Frontend to Railway (Separate Service)
1. Create a new service in Railway for the frontend
2. Set the root directory to `real-estate-map`
3. Set build command: `npm run build`
4. Set start command: `npx serve -s build -l 3000`
5. Add environment variable: `REACT_APP_API_URL` = (your backend URL)

## Environment Variables Summary

### Backend Service
- `PORT` - Server port (Railway auto-assigns if not set)
- `NODE_ENV` - Set to `production`
- `JWT_SECRET` - Secret key for JWT tokens (use a strong random string)

### Frontend Service (if deploying separately)
- `REACT_APP_API_URL` - Your Railway backend URL (e.g., `https://your-backend.railway.app`)

## Database

The application uses SQLite, which will be stored in the Railway volume at `real-estate-map/backend/data/clintonville.db`.

For production, consider migrating to PostgreSQL:
1. Add PostgreSQL plugin in Railway
2. Update `db.js` to use PostgreSQL connection string
3. Set `DATABASE_URL` environment variable

## Troubleshooting

### Check Logs
```bash
railway logs
```

### View Service Status
```bash
railway status
```

### Redeploy
```bash
railway up
```

## Default Admin Credentials

After first deployment, the default admin user is created:
- Email: `admin@clintonville.com`
- Password: `admin123`

**⚠️ IMPORTANT: Change the default admin password immediately in production!**

