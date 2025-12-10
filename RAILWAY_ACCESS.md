# How to Access Your Railway Deployment

## Finding Your Service URL

### Method 1: Railway Dashboard
1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click on your project
3. Click on your service (backend)
4. Go to the **Settings** tab
5. Scroll to **Domains** section
6. You'll see your service URL like: `https://your-service-name.up.railway.app`

### Method 2: Generate a Public Domain
1. In your service → **Settings** → **Domains**
2. Click **Generate Domain** (if not already generated)
3. Railway will create a public URL for you

## Testing Your Backend

### 1. Test the Root Endpoint
Open in browser or use curl:
```
https://your-service-name.up.railway.app/api/properties
```

### 2. Test Health Check
```
https://your-service-name.up.railway.app/api/properties
```
This should return an empty array `[]` or your properties list.

### 3. View Logs
- Go to your service → **Deployments** tab
- Click on the latest deployment
- View **Logs** to see server output

## Default Admin Login

After deployment, you can test login:
- **Email**: `admin@clintonville.com`
- **Password**: `admin123`

Use the login endpoint:
```
POST https://your-service-name.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "admin@clintonville.com",
  "password": "admin123"
}
```

## Connecting Frontend

Once you have your backend URL, update your frontend:

1. Set environment variable in frontend:
   ```
   REACT_APP_API_URL=https://your-service-name.up.railway.app
   ```

2. Or update the frontend code to use the Railway URL instead of localhost

## Troubleshooting

### Service Not Responding?
- Check **Logs** in Railway dashboard
- Verify environment variables are set
- Check if the service is running (should show "Active" status)

### CORS Issues?
- Your backend already has CORS enabled
- Make sure frontend URL is allowed in CORS settings if needed

### Database Issues?
- SQLite database is created automatically
- Check logs for database initialization errors
- Database file is stored in Railway's filesystem

