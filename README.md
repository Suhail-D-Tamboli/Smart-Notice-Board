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
3. VAPID keys for push notifications

### Steps to Deploy

1. **Prepare Environment Variables**:
   Create the following environment variables in your Vercel project settings:
   - `MONGODB_URI` - Your MongoDB connection string
   - `VAPID_EMAIL` - Email for VAPID keys
   - `VAPID_PUBLIC_KEY` - Public VAPID key
   - `VAPID_PRIVATE_KEY` - Private VAPID key

2. **Generate VAPID Keys** (if you don't have them):
   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Or deploy using the Vercel CLI:
     ```bash
     npm install -g vercel
     vercel
     ```

4. **Configure Environment Variables** in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all required environment variables

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