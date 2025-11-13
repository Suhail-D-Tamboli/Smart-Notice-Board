import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import webpushLib from 'web-push';
import { generateAIPosterAsync } from './src/services/aiPosterService.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5011;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tambolisuhail3_db_user:9isOHM0Ay4NqTxW7@realtimeemergency.zutppat.mongodb.net/smart-campus-hub?retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'smart-campus-hub';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpushLib.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:your-email@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.log('VAPID keys not configured. Push notifications will not work.');
}

let db;
let client;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'local',
    mongodbConfigured: !!process.env.MONGODB_URI
  });
});

// Serve static files from the React app build directory and uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Only serve static files in production/non-Vercel environments
if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// Only in production/non-Vercel environments
if (!process.env.VERCEL) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}

// Connect to MongoDB - only when not in Vercel build environment
if (!process.env.VERCEL || process.env.VERCEL_ENV === 'development') {
  connectToDatabase();
}

// Start server - only when not running on Vercel or in development
if (!process.env.VERCEL || process.env.VERCEL_ENV === 'development') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
  });
}

// Graceful shutdown - only when not running on Vercel
if ((!process.env.VERCEL || process.env.VERCEL_ENV === 'development') && typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  });
}

// Export the app for Vercel
export default app;
