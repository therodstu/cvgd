# Using Private Database Endpoint (Avoid Egress Fees)

## Important: Use Private Endpoint

Railway provides two database connection strings:

- ✅ **`DATABASE_URL`** - Private/internal endpoint (NO egress fees)
- ❌ **`DATABASE_PUBLIC_URL`** - Public endpoint (incurs egress fees)

## Always Use DATABASE_URL

Your backend code is configured to use `DATABASE_URL` (the private endpoint) to avoid egress fees.

### How to Verify You're Using the Private Endpoint

1. **In PostgreSQL Service:**
   - Go to **Variables** tab
   - Look for `DATABASE_URL`
   - The connection string should contain:
     - `.railway.internal` (private)
     - Or an internal IP address
     - **NOT** a public domain like `.railway.app` or `containers-us-west-xxx.railway.app`

2. **In Backend Service:**
   - Go to **Variables** tab
   - Verify `DATABASE_URL` is set (not `DATABASE_PUBLIC_URL`)
   - The value should match the one from PostgreSQL service

### If You See the Warning

If Railway shows a warning about `DATABASE_PUBLIC_URL`:

1. **Don't worry** - This is just a warning about that variable
2. **Make sure** your backend is using `DATABASE_URL` (not `DATABASE_PUBLIC_URL`)
3. **Check** your backend service variables to confirm

### How Services Connect Privately

When both services (Backend and PostgreSQL) are in the same Railway project:

- They communicate over Railway's **private network**
- No data goes over the public internet
- **No egress fees** are charged
- Faster connection (lower latency)

### Troubleshooting

**If you're getting connection timeouts:**

1. Verify both services are in the **same Railway project**
2. Check that `DATABASE_URL` is set in backend (not `DATABASE_PUBLIC_URL`)
3. Make sure PostgreSQL service is **running** (not paused)
4. Check Railway logs for connection errors

**If you accidentally used DATABASE_PUBLIC_URL:**

1. Go to Backend service → Variables
2. Delete `DATABASE_PUBLIC_URL` if it exists
3. Add/Update `DATABASE_URL` with the value from PostgreSQL service
4. Redeploy the backend

## Summary

✅ **Use:** `DATABASE_URL` from PostgreSQL service  
❌ **Don't use:** `DATABASE_PUBLIC_URL`  
💰 **Result:** No egress fees, faster connections

