import { connectToDatabase, COLLECTIONS } from './services/mongodb';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const { client, db } = await connectToDatabase();
    
    console.log('Successfully connected to MongoDB!');
    
    // Test creating a sample collection and document
    const usersCollection = db.collection(COLLECTIONS.USERS);
    
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
    
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
  }
}

// Run the test
testConnection();