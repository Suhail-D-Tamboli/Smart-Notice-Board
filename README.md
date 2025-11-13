# Smart Campus Hub

A comprehensive notice and event management system for educational institutions with real-time notifications, AI features, and more.

## Features

- Real-time push notifications for notices and events
- AI-powered notice summarization
- AI-generated event posters
- Speech-to-text for notice creation
- Student event registration system
- Department and semester-based filtering
- Multi-language support (Kannada, Hindi, English)
- Responsive design for all devices

## Deployment to Vercel

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. A MongoDB database (MongoDB Atlas recommended)

### Steps to Deploy

1. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Or deploy using the Vercel CLI:
     ```bash
     npm install -g vercel
     vercel
     ```

2. **Configure Environment Variables** in Vercel dashboard:
   Go to your project settings → "Environment Variables" and add:
   - `MONGODB_URI` - Your MongoDB connection string
   - `VAPID_EMAIL` - Email for VAPID keys (optional, for push notifications)
   - `VAPID_PUBLIC_KEY` - Public VAPID key (optional, for push notifications)
   - `VAPID_PRIVATE_KEY` - Private VAPID key (optional, for push notifications)

3. **Generate VAPID Keys** (if you want push notifications):
   ```bash
   npx web-push generate-vapid-keys
   ```

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   VAPID_EMAIL=your_email@example.com
   VAPID_PUBLIC_KEY=your_public_vapid_key
   VAPID_PRIVATE_KEY=your_private_vapid_key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev:full
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

5. **Run Production Server**:
   ```bash
   npm start
   ```

## Project Structure

- `src/` - Frontend React components
- `server.js` - Backend Express server
- `public/` - Static assets and service worker
- `dist/` - Built frontend files (generated after build)

## Important Notes

- File uploads are stored in the `uploads/` directory
- The application uses MongoDB for data storage
- Push notifications require HTTPS in production
- Service worker must be at the root level for push notifications to work

## Troubleshooting

1. **Push Notifications Not Working**:
   - Ensure VAPID keys are correctly configured
   - Check that the service worker is properly registered
   - Verify HTTPS is being used in production

2. **Database Connection Issues**:
   - Verify MongoDB URI is correct
   - Check MongoDB Atlas IP whitelist
   - Ensure database credentials are correct

3. **File Upload Issues**:
   - Check file size limits
   - Verify upload directory permissions
   - Ensure sufficient storage space

4. **Vercel Deployment Issues**:
   - Make sure all required environment variables are set in Vercel dashboard
   - Check the deployment logs for specific error messages
   - Ensure your MongoDB Atlas cluster allows connections from Vercel IPs
   - If you see permission errors, try redeploying as the build cache may need to be refreshed
   - Make sure your Vercel project is set to use the correct Node.js version (14 or higher)
   - Ensure the `dist/` directory is properly built before deployment
   - Verify that no custom build scripts are interfering with the deployment process