import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import multer from 'multer';
import webpush from 'web-push';

// Load environment variables
dotenv.config();

const app = express();

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'smart-campus';

let client;
let db;
let isConnected = false;

// Middleware
app.use(express.json());

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
  if (isConnected && db) {
    return db;
  }

  try {
    if (!MONGODB_URI) {
      console.log('MONGODB_URI not configured. Skipping database connection.');
      return null;
    }
    
    console.log('Attempting to connect to MongoDB...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    console.log('Successfully connected to MongoDB Atlas');
    
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    return null;
  }
}

// API Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { username, password, role } = req.body;
    console.log('Login attempt:', { username, role });

    const user = await database.collection('users').findOne({ username, role });
    
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
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { username, password, role, semester, department } = req.body;
    console.log('Signup attempt:', { username, role });

    // Check if user already exists
    const existingUser = await database.collection('users').findOne({ username, role });
    
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

    const result = await database.collection('users').insertOne(newUser);
    
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
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const notices = await database.collection('notices')
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
    const database = await connectToDatabase();
    if (!database) {
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

    const result = await database.collection('notices').insertOne(notice);
    
    res.json({ success: true, noticeId: result.insertedId });
  } catch (error) {
    console.error('Add notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete notice endpoint
app.delete('/api/notices/:id', async (req, res) => {
  try {
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { id } = req.params;
    const result = await database.collection('notices').deleteOne({ _id: new ObjectId(id) });
    
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
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const events = await database.collection('events')
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
    const database = await connectToDatabase();
    if (!database) {
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

    const result = await database.collection('events').insertOne(event);
    
    res.json({ success: true, eventId: result.insertedId });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Event registration endpoint
app.post('/api/events/:id/registrations', async (req, res) => {
  try {
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { id } = req.params;
    const registrationData = req.body;

    // Check if student is already registered
    const existingRegistration = await database.collection('registrations').findOne({
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

    await database.collection('registrations').insertOne(registration);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update event registration form fields
app.put('/api/events/:id/registration-form', async (req, res) => {
  try {
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { id } = req.params;
    const { registrationFields } = req.body;

    const result = await database.collection('events').updateOne(
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
    const database = await connectToDatabase();
    const { subscription, userId } = req.body;
    console.log('New push subscription for user:', userId);
    
    if (database) {
      await database.collection('subscriptions').updateOne(
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
    
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }
    
    // Update user's notification status
    const result = await database.collection('users').updateOne(
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
    const database = await connectToDatabase();
    if (!database) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const { title, body } = req.body;
    const subscriptions = await database.collection('subscriptions').find({}).toArray();
    
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

// Export handler for Vercel
export default app;
