import { MongoClient } from 'mongodb';

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://tambolisuhail3_db_user:9isOHM0Ay4NqTxW7@realtimeemergency.zutppat.mongodb.net/smart-campus-hub?retryWrites=true&w=majority';
const DB_NAME = 'smart-campus-hub';

async function listUsers() {
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
    users.forEach(user => {
      console.log(`- ${user.username} (${user.role})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Password: ${user.password}`);
      if (user.department) console.log(`  Department: ${user.department}`);
      if (user.semester) console.log(`  Semester: ${user.semester}`);
      console.log();
    });
    
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    // Close the connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the function
listUsers();