# Vercel Deployment Setup

## Environment Variables Configuration

To make push notifications work on Vercel, you need to set up the following environment variables in your Vercel project dashboard:

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project: `smart-notice-board-ruby`
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

### Required Environment Variables

```
MONGODB_URI=mongodb+srv://tambolisuhail3_db_user:9isOHM0Ay4NqTxW7@realtimeemergency.zutppat.mongodb.net/?appName=RealTimeEmergency

DB_NAME=smart-campus

VAPID_PUBLIC_KEY=BJdYXxnyOQVcbmcvyDMYZ_fQc6otfiBb4zEqiYjk1qd8oU-6G9MUUS2NTWvuvvrVDuzMxxX6SmoQdpO76S46UGE

VAPID_PRIVATE_KEY=oV_BD2k4lVso--YRklGVFjxIKVNdGK83tOfX2T7HFho

VAPID_EMAIL=mailto:admin@smartcampus.com
```

### Steps to Add:

1. Click **Add New** button
2. Enter the variable name (e.g., `MONGODB_URI`)
3. Enter the variable value
4. Select the environments: **Production**, **Preview**, and **Development**
5. Click **Save**
6. Repeat for all variables

### After Adding Variables:

1. Go to the **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (optional)
5. Click **Redeploy**

Your push notifications should now work on the deployed Vercel app!

## Testing Push Notifications

After redeployment:
1. Visit your site: https://smart-notice-board-ruby.vercel.app/
2. Log in as a student
3. Enable notifications when prompted
4. Check the browser console - you should see "PushService: Got VAPID public key" instead of 404 errors

## Troubleshooting

If you still see 404 errors:
- Verify all environment variables are set correctly in Vercel
- Make sure you redeployed after adding the variables
- Check the Vercel function logs for any errors
- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
