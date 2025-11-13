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

// Log MongoDB configuration status
if (!process.env.MONGODB_URI) {
  console.log('WARNING: MONGODB_URI not set in environment variables. Using default connection string.');
} else {
  console.log('MONGODB_URI is set in environment variables.');
}

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
    // Don't try to connect if MONGODB_URI is not set
    if (!MONGODB_URI) {
      console.log('MONGODB_URI not configured. Skipping database connection.');
      return;
    }
    
    console.log('Attempting to connect to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Don't exit in Vercel environment, just log the error
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

// Serve static files from the React app build directory and uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
// User routes
app.post('/api/auth/login', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { username, password, role } = req.body;
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ username, password, role });
    
    if (user) {
      console.log('Login successful for user:', user.username, 'Department:', user.department, 'Semester:', user.semester);
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { username, password, role, semester, department } = req.body;
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username, role });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const newUser = {
      username,
      password,
      role,
      semester: role === 'student' ? semester : undefined,
      department: role === 'student' ? department : undefined,
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId;
    
    console.log('Signup successful for user:', username);
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'local',
    mongodbConfigured: !!process.env.MONGODB_URI
  });
});

// Notice routes
app.get('/api/notices', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { department, semester } = req.query;
    const noticesCollection = db.collection('notices');
    
    console.log('Fetching notices with filters - Department:', department, 'Semester:', semester);
    
    // If department and semester are provided, filter by them
    let query = {};
    if (department && semester) {
      query = { department, semester };
      console.log('Using query filter:', query);
    }
    
    const notices = await noticesCollection.find(query).sort({ date: -1 }).toArray();
    console.log('Found notices:', notices.length);
    res.json(notices);
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/notices', upload.single('file'), async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { title, description, semester, department, createdBy } = req.body;
    const noticesCollection = db.collection('notices');
    
    const newNotice = {
      title,
      description,
      semester,
      department,
      createdBy,
      date: new Date(),
      createdAt: new Date()
    };
    
    // Add file path if file was uploaded
    if (req.file) {
      newNotice.file = `/uploads/${req.file.filename}`;
    }
    
    const result = await noticesCollection.insertOne(newNotice);
    newNotice._id = result.insertedId;
    
    console.log('New notice created:', newNotice._id);
    
    res.json(newNotice);
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/notices/:id', upload.single('file'), async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { id } = req.params;
    const { title, description, semester, department } = req.body;
    const noticesCollection = db.collection('notices');
    
    const updateData = {
      title,
      description,
      semester,
      department
    };
    
    // Add file path if file was uploaded
    if (req.file) {
      updateData.file = `/uploads/${req.file.filename}`;
    }
    
    const result = await noticesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    
    const updatedNotice = await noticesCollection.findOne({ _id: new ObjectId(id) });
    res.json(updatedNotice);
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { id } = req.params;
    const noticesCollection = db.collection('notices');
    
    const result = await noticesCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Event routes
app.get('/api/events', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { department, semester } = req.query;
    const eventsCollection = db.collection('events');
    
    console.log('Fetching events with filters - Department:', department, 'Semester:', semester);
    
    // If department and semester are provided, filter by them
    let query = {};
    if (department && semester) {
      query = { department, semester };
      console.log('Using query filter:', query);
    }
    
    const events = await eventsCollection.find(query).sort({ date: -1 }).toArray();
    console.log('Found events:', events.length);
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/events', upload.single('file'), async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { title, description, date, createdBy, registrationFields, semester, department } = req.body;
    const eventsCollection = db.collection('events');
    
    const newEvent = {
      title,
      description,
      date: new Date(date),
      createdBy,
      semester,
      department,
      createdAt: new Date(),
      hasRegistrationForm: false
    };
    
    // Add file path if file was uploaded
    if (req.file) {
      newEvent.file = `/uploads/${req.file.filename}`;
    }
    
    // Add registration fields if provided
    if (registrationFields) {
      newEvent.registrationFields = JSON.parse(registrationFields);
      newEvent.hasRegistrationForm = true;
    }
    
    const result = await eventsCollection.insertOne(newEvent);
    newEvent._id = result.insertedId;
    
    console.log('New event created:', newEvent._id);
    
    res.json(newEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/events/:id', upload.single('file'), async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { id } = req.params;
    const { title, description, date, registrationFields, semester, department } = req.body;
    const eventsCollection = db.collection('events');
    
    const updateData = {
      title,
      description,
      date: new Date(date),
      semester,
      department
    };
    
    // Add file path if file was uploaded
    if (req.file) {
      updateData.file = `/uploads/${req.file.filename}`;
    }
    
    // Add registration fields if provided
    if (registrationFields) {
      updateData.registrationFields = JSON.parse(registrationFields);
      updateData.hasRegistrationForm = true;
    }
    
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    const updatedEvent = await eventsCollection.findOne({ _id: new ObjectId(id) });
    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not available. Please check MongoDB configuration.' });
    }
    
    const { id } = req.params;
    const eventsCollection = db.collection('events');
    
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Connect to MongoDB - always try to connect, but handle errors gracefully
connectToDatabase();

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