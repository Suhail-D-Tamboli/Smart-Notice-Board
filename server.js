import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import webpush from 'web-push';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5011;

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'smart-campus';

let client;
let db;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@smartcampus.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    // Don't try to connect if MONGODB_URI is not set
    if (!MONGODB_URI) {
      console.log('MONGODB_URI not configured. Skipping database connection.');
      return;
    }
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in logs
    console.log('Database name:', DB_NAME);
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Successfully connected to MongoDB Atlas');
    
    // Ensure collections exist
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes('users')) {
        await db.createCollection('users');
        console.log('Created users collection');
      }
      
      if (!collectionNames.includes('notices')) {
        await db.createCollection('notices');
        console.log('Created notices collection');
      }
      
      if (!collectionNames.includes('events')) {
        await db.createCollection('events');
        console.log('Created events collection');
      }
      
      console.log('Database collections verified:', collectionNames);
    } catch (collectionError) {
      console.error('Error ensuring collections exist:', collectionError.message);
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    // Don't exit in Vercel environment, just log the error
    if (!process.env.VERCEL) {
      console.log('Exiting due to database connection error (non-Vercel environment)');
      process.exit(1);
    } else {
      console.log('Continuing despite database connection error (Vercel environment)');
    }
  }
}

// API Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    console.log('Login attempt:', { username, role });

    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const user = await db.collection('users').findOne({ username, role });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    res.json({ 
      success: true, 
      user: { 
        _id: user._id.toString(),
        userId: user.username,
        username: user.username,
        name: user.username,
        role: user.role,
        department: user.department,
        semester: user.semester
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { username, password, role, semester, department } = req.body;
    console.log('Signup attempt:', { username, role });

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ username, role });
    
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // Create new user
    const newUser = {
      username,
      password, // In production, hash this!
      role,
      ...(role === 'student' && { semester, department }),
      createdAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    
    res.json({ 
      success: true, 
      user: { 
        _id: result.insertedId.toString(),
        userId: username,
        username,
        name: username,
        role,
        department,
        semester
      } 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get notices endpoint
app.get('/api/notices', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const notices = await db.collection('notices')
      .find({})
      .sort({ date: -1 })
      .toArray();
    
    res.json({ success: true, notices });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add notice endpoint
app.post('/api/notices', upload.single('poster'), async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { title, description, date, category } = req.body;
    const poster = req.file ? {
      data: req.file.buffer.toString('base64'),
      contentType: req.file.mimetype
    } : null;

    const notice = {
      title,
      description,
      date: new Date(date),
      category,
      poster,
      createdAt: new Date()
    };

    const result = await db.collection('notices').insertOne(notice);
    
    res.json({ success: true, noticeId: result.insertedId });
  } catch (error) {
    console.error('Add notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete notice endpoint
app.delete('/api/notices/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { id } = req.params;
    const result = await db.collection('notices').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get events endpoint
app.get('/api/events', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const events = await db.collection('events')
      .find({})
      .sort({ date: -1 })
      .toArray();
    
    res.json({ success: true, events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add event endpoint
app.post('/api/events', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { title, description, date, location } = req.body;
    const event = {
      title,
      description,
      date: new Date(date),
      location,
      createdAt: new Date()
    };

    const result = await db.collection('events').insertOne(event);
    
    res.json({ success: true, eventId: result.insertedId });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Event registration endpoint
app.post('/api/events/:id/registrations', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { id } = req.params;
    const registrationData = req.body;

    // Check if student is already registered
    const existingRegistration = await db.collection('registrations').findOne({
      eventId: id,
      studentId: registrationData.studentId
    });

    if (existingRegistration) {
      return res.status(409).json({ success: false, message: 'Already registered for this event' });
    }

    const registration = {
      eventId: id,
      ...registrationData,
      createdAt: new Date()
    };

    await db.collection('registrations').insertOne(registration);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update event registration form fields
app.put('/api/events/:id/registration-form', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { id } = req.params;
    const { registrationFields } = req.body;

    const result = await db.collection('events').updateOne(
      { _id: new ObjectId(id) },
      { $set: { registrationFields } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update registration form error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get VAPID public key
app.get('/api/vapid-public-key', (req, res) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY) {
      return res.status(503).json({ success: false, message: 'VAPID keys not configured' });
    }
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
  } catch (error) {
    console.error('Get VAPID key error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Subscribe to push notifications
app.post('/api/push-subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    console.log('New push subscription for user:', userId);
    
    // Store subscription in database if needed
    if (db) {
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { subscription, userId, createdAt: new Date() } },
        { upsert: true }
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user notification status
app.post('/api/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const { notificationsEnabled } = req.body;
    
    console.log('Updating notification status for user:', userId, 'enabled:', notificationsEnabled);
    
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }
    
    // Update user's notification status
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { notificationsEnabled: notificationsEnabled } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update notification status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send push notification
app.post('/api/send-notification', async (req, res) => {
  try {
    const { title, body } = req.body;
    
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const subscriptions = await db.collection('subscriptions').find({}).toArray();
    
    const payload = JSON.stringify({ title, body });
    const promises = subscriptions.map(sub => 
      webpush.sendNotification(sub, payload)
        .catch(err => console.error('Error sending notification:', err))
    );
    
    await Promise.all(promises);
    
    res.json({ success: true, count: subscriptions.length });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send test notification to specific user
app.post('/api/send-test-notification', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    // Get user's subscription
    const userSubscription = await db.collection('subscriptions').findOne({ userId });
    
    if (!userSubscription || !userSubscription.subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found for user' });
    }
    
    const payload = JSON.stringify({ 
      title: title || 'Test Notification', 
      body: body || 'This is a test notification',
      url: '/student'
    });
    
    await webpush.sendNotification(userSubscription.subscription, payload);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server (only if not in Vercel environment)
if (!process.env.VERCEL) {
  connectToDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  });
} else {
  // For Vercel, connect to database immediately
  connectToDatabase();
}

// Export for Vercel serverless
export default app;