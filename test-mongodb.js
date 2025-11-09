import { MongoClient } from 'mongodb';

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://tambolisuhail3_db_user:9isOHM0Ay4NqTxW7@realtimeemergency.zutppat.mongodb.net/smart-campus-hub?retryWrites=true&w=majority';
const DB_NAME = 'smart-campus-hub';

async function testConnection() {
  let client;
  
  try {
    console.log('Testing MongoDB connection...');
    
    // Create a new MongoClient
    client = new MongoClient(MONGODB_URI);
    
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');
    
    // Specify which database we want to use
    const db = client.db(DB_NAME);
    console.log(`Connected to database: ${DB_NAME}`);
    
    // Test creating a sample collection and document
    const usersCollection = db.collection('users');
    
    // Insert a test user
    const testUser = {
      username: 'testuser',
      password: 'testpassword',
      role: 'student',
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(testUser);
    console.log('Test user inserted with ID:', result.insertedId);
    
    // Retrieve the test user
    const retrievedUser = await usersCollection.findOne({ _id: result.insertedId });
    console.log('Retrieved user:', retrievedUser);
    
    // Clean up - delete the test user
    await usersCollection.deleteOne({ _id: result.insertedId });
    console.log('Test user cleaned up');
    
    console.log('MongoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
  } finally {
    // Close the connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the test
testConnection();