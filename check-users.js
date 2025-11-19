import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'smart-campus';

console.log('MONGODB_URI:', MONGODB_URI);
console.log('DB_NAME:', DB_NAME);

async function checkUsers() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    
    // Create a new MongoClient
    client = new MongoClient(MONGODB_URI);
    
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');
    
    // Specify which database we want to use
    const db = client.db(DB_NAME);
    console.log(`Connected to database: ${DB_NAME}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Get all users
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`Found ${users.length} users:`);
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`- ${user.username} (${user.role})`);
        console.log(`  ID: ${user._id}`);
        console.log(`  Password: ${user.password}`);
        if (user.department) console.log(`  Department: ${user.department}`);
        if (user.semester) console.log(`  Semester: ${user.semester}`);
        console.log();
      });
    } else {
      console.log('No users found in the database.');
      
      // Let's create a test teacher user
      console.log('Creating a test teacher user...');
      const testTeacher = {
        username: 'teacher1',
        password: 'password123',
        role: 'teacher',
        createdAt: new Date()
      };
      
      const result = await usersCollection.insertOne(testTeacher);
      console.log('Test teacher created with ID:', result.insertedId);
      
      // Let's also create a test student user
      console.log('Creating a test student user...');
      const testStudent = {
        username: 'student1',
        password: 'password123',
        role: 'student',
        department: 'CS',
        semester: '4',
        createdAt: new Date()
      };
      
      const result2 = await usersCollection.insertOne(testStudent);
      console.log('Test student created with ID:', result2.insertedId);
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    // Close the connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the function
checkUsers();