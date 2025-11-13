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