const { MongoClient } = require('mongodb');

async function createTestNotice() {
  const uri = "mongodb+srv://suho:Suho195@realtimeemergency.zutppat.mongodb.net/?appName=RealTimeEmergency";
  const dbName = "smart-campus";
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db(dbName);
    const noticesCollection = db.collection('notices');
    
    // Create a test notice with all required fields
    const testNotice = {
      title: "Library Maintenance Notice",
      description: "The library will be closed tomorrow for maintenance. Please plan your study schedule accordingly. We apologize for any inconvenience this may cause.",
      date: new Date(),
      semester: ["5"],
      department: ["CS"],
      createdBy: "Admin",
      createdAt: new Date()
    };
    
    const result = await noticesCollection.insertOne(testNotice);
    console.log("Test notice created with ID:", result.insertedId);
    
    // Verify the notice was created
    const createdNotice = await noticesCollection.findOne({ _id: result.insertedId });
    console.log("Created notice:", createdNotice);
  } catch (error) {
    console.error("Error creating test notice:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

createTestNotice();