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

// Serve static files from the React app build directory and uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tambolisuhail3_db_user:9isOHM0Ay4NqTxW7@realtimeemergency.zutppat.mongodb.net/smart-campus-hub?retryWrites=true&w=majority';
const DB_NAME = 'smart-campus-hub';

// Configure web-push with VAPID keys
webpushLib.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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

// Connect to database when server starts
connectToDatabase();

// Middleware to verify user authentication
const verifyUser = async (req, res, next) => {
  try {
    // In a real implementation, you would verify JWT token here
    // For now, we'll check if user data is passed in the request body
    const { studentId, studentName } = req.body;
    
    if (!studentId || !studentName) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in to register for this event.' 
      });
    }
    
    // Verify user exists in database
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(studentId),
      username: studentName
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid user credentials.' 
      });
    }
    
    // Attach user to request for use in subsequent middleware/routes
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed.' 
    });
  }
};

// Check if student is already registered for an event
const checkRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentId, studentName } = req.body;
    
    const registrationsCollection = db.collection('student-registrations');
    const existingRegistration = await registrationsCollection.findOne({ 
      eventId: id,
      $or: [
        { studentId: studentId },
        { studentName: studentName }
      ]
    });
    
    if (existingRegistration) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already registered for this event.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Registration check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check registration status.' 
    });
  }
};

// Updated student registration route with authentication and duplicate check
app.post('/api/events/:id/registrations', checkRegistration, async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, studentName, rollNumber, department, semester, email, ...registrationData } = req.body;
    
    // Verify user exists in database
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(studentId),
      username: studentName
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in to register for this event.' 
      });
    }
    
    const registrationsCollection = db.collection('student-registrations');
    
    // Auto-fill student info from authenticated user
    const newRegistration = {
      eventId: id,
      studentId: user._id.toString(),
      studentName: user.username,
      rollNumber: user.rollNumber || rollNumber || '', // Prefer user profile data
      department: user.department,
      semester: user.semester,
      email: user.email || email || '', // Prefer user profile data
      createdAt: new Date(),
      // Include any additional registration fields provided by the event
      ...registrationData
    };
    
    const result = await registrationsCollection.insertOne(newRegistration);
    newRegistration._id = result.insertedId;
    
    res.json({ 
      success: true, 
      message: 'Registration successful!',
      registration: newRegistration
    });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to register for event. Please try again.' 
    });
  }
});

// API Routes
// User routes
app.post('/api/auth/login', async (req, res) => {
  try {
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

// Update user notification status
app.post('/api/users/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;
    const { notificationsEnabled } = req.body;
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { notificationsEnabled } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update user notification status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, role, semester, department, rollNumber, email } = req.body;
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const newUser = {
      username,
      password, // In a real app, this should be hashed
      role,
      semester,
      department,
      rollNumber: rollNumber || '',
      email: email || '',
      notificationsEnabled: false, // New field to track notification status
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId;
    
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Notice routes
app.get('/api/notices', async (req, res) => {
  try {
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
    
    // Generate AI poster asynchronously (non-blocking)
    generateAIPosterAsync(newNotice, 'notice', db)
      .then(posterUrl => {
        if (posterUrl) {
          console.log(`AI poster generated for notice ${newNotice._id}: ${posterUrl}`);
        }
      })
      .catch(error => {
        console.error('Error generating AI poster for notice:', error);
      });
    
    // Send push notification to subscribers matching department and semester
    const pushResult = await sendPushNotification({
      title: '📢 New Notice Posted',
      body: `${title.substring(0, 100)}${title.length > 100 ? '...' : ''}`,
      icon: '/favicon.ico',
      url: '/',
      tag: 'new-notice',
      noticeId: newNotice._id
    }, department, semester);
    
    console.log('Push notification result:', pushResult);
    
    res.json(newNotice);
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/notices/:id', upload.single('file'), async (req, res) => {
  try {
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

// New endpoint to generate AI poster for a notice
app.post('/api/notices/:id/generate-poster', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const noticesCollection = db.collection('notices');
    
    // In a real implementation, this would call an AI service to generate a poster
    // For now, we'll generate a placeholder poster URL
    const posterUrl = `/uploads/poster-${id}.png`;
    
    // Update the notice with the poster URL
    const result = await noticesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { poster: posterUrl } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    
    res.json({ success: true, posterUrl });
  } catch (error) {
    console.error('Generate notice poster error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const noticesCollection = db.collection('notices');
    
    // Get the notice to get department and semester for targeted notifications
    const notice = await noticesCollection.findOne({ _id: new ObjectId(id) });
    
    const result = await noticesCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    
    // Send push notification about deletion to subscribers matching department and semester
    if (notice) {
      await sendPushNotification({
        title: '🗑️ Notice Removed',
        body: 'A notice has been removed by the administration',
        icon: '/favicon.ico',
        url: '/',
        tag: 'deleted-notice'
      }, notice.department, notice.semester);
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
    
    // Generate AI poster asynchronously (non-blocking)
    generateAIPosterAsync(newEvent, 'event', db)
      .then(posterUrl => {
        if (posterUrl) {
          console.log(`AI poster generated for event ${newEvent._id}: ${posterUrl}`);
        }
      })
      .catch(error => {
        console.error('Error generating AI poster for event:', error);
      });
    
    // Send push notification to subscribers matching department and semester
    const pushResult = await sendPushNotification({
      title: '📅 New Event Posted',
      body: `${title.substring(0, 100)}${title.length > 100 ? '...' : ''}`,
      icon: '/favicon.ico',
      url: '/',
      tag: 'new-event',
      eventId: newEvent._id
    }, department, semester);
    
    console.log('Push notification result:', pushResult);
    
    res.json(newEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/events/:id', upload.single('file'), async (req, res) => {
  try {
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
    
    const updatedEvent = await eventsCollection.findOne({ _id: id });
    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add endpoint to fetch a single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventsCollection = db.collection('events');
    
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// New endpoint to update registration form for an event
app.put('/api/events/:id/registration-form', async (req, res) => {
  try {
    const { id } = req.params;
    const { registrationFields } = req.body;
    const eventsCollection = db.collection('events');
    
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          registrationFields: registrationFields,
          hasRegistrationForm: true
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    const updatedEvent = await eventsCollection.findOne({ _id: new ObjectId(id) });
    res.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Update registration form error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// New endpoint to generate AI poster for an event
app.post('/api/events/:id/generate-poster', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const eventsCollection = db.collection('events');
    
    // In a real implementation, this would call an AI service to generate a poster
    // For now, we'll generate a placeholder poster URL
    const posterUrl = `/uploads/poster-${id}.png`;
    
    // Update the event with the poster URL
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { poster: posterUrl } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true, posterUrl });
  } catch (error) {
    console.error('Generate event poster error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventsCollection = db.collection('events');
    
    // Get the event to get department and semester for targeted notifications
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // Send push notification about deletion to subscribers matching department and semester
    if (event) {
      await sendPushNotification({
        title: '🗑️ Event Cancelled',
        body: 'An event has been cancelled by the administration',
        icon: '/favicon.ico',
        url: '/',
        tag: 'deleted-event'
      }, event.department, event.semester);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Student registration routes
app.get('/api/events/:id/registrations', async (req, res) => {
  try {
    const { id } = req.params;
    const registrationsCollection = db.collection('student-registrations');
    
    const registrations = await registrationsCollection.find({ eventId: id }).toArray();
    res.json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// New endpoint to get registered events count for a student
app.get('/api/students/:studentId/registered-events-count', async (req, res) => {
  try {
    const { studentId } = req.params;
    const registrationsCollection = db.collection('student-registrations');
    
    // Count registrations for this student by username
    const count = await registrationsCollection.countDocuments({ 
      studentName: studentId
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Get registered events count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Push Notification Routes

// Get VAPID public key
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
app.post('/api/push-subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    const subscriptionsCollection = db.collection('push-subscriptions');
    
    // Check if subscription already exists
    const existing = await subscriptionsCollection.findOne({ 
      endpoint: subscription.endpoint 
    });
    
    if (existing) {
      // Update existing subscription
      await subscriptionsCollection.updateOne(
        { endpoint: subscription.endpoint },
        { 
          $set: { 
            userId,
            keys: subscription.keys,
            updatedAt: new Date()
          } 
        }
      );
    } else {
      // Create new subscription
      await subscriptionsCollection.insertOne({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    res.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Unsubscribe from push notifications
app.post('/api/push-unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    const subscriptionsCollection = db.collection('push-subscriptions');
    
    await subscriptionsCollection.deleteOne({ endpoint });
    
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send push notification to all subscribers
async function sendPushNotification(payload, department = null, semester = null) {
  try {
    console.log('Sending push notification with payload:', payload);
    const subscriptionsCollection = db.collection('push-subscriptions');
    
    // If department and semester are provided, filter subscribers
    let query = {};
    if (department && semester) {
      // First get users matching department and semester
      const usersCollection = db.collection('users');
      const matchingUsers = await usersCollection.find({ 
        department: department, 
        semester: semester 
      }).toArray();
      
      const userIds = matchingUsers.map(user => user._id.toString());
      console.log(`Found ${userIds.length} users matching department ${department} and semester ${semester}`);
      
      // Filter subscriptions to only those users
      query = { userId: { $in: userIds } };
    }
    
    const subscriptions = await subscriptionsCollection.find(query).toArray();
    
    console.log(`Sending push notification to ${subscriptions.length} subscribers`);
    
    if (department && semester) {
      console.log(`Filtered to users in department: ${department}, semester: ${semester}`);
    }
    
    if (subscriptions.length === 0) {
      console.log('No subscribers found, skipping notification');
      return { success: true, sent: 0 };
    }
    
    const notifications = subscriptions.map(async (sub) => {
      try {
        console.log('Sending to subscription:', sub.endpoint.substring(0, 50));
        // Log user info for debugging
        if (sub.userId) {
          console.log('Sending to user ID:', sub.userId);
        }
        await webpushLib.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          JSON.stringify(payload)
        );
        console.log('Notification sent to:', sub.endpoint.substring(0, 50));
      } catch (error) {
        console.error('Error sending to subscription:', error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await subscriptionsCollection.deleteOne({ endpoint: sub.endpoint });
          console.log('Removed invalid subscription');
        }
      }
    });
    
    await Promise.all(notifications);
    return { success: true, sent: subscriptions.length };
  } catch (error) {
    console.error('Send push notification error:', error);
    return { success: false, error: error.message };
  }
}

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Start server - only when not running on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
  });
}

// Graceful shutdown - only when not running on Vercel
if (!process.env.VERCEL) {
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
