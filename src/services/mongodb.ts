import { MongoClient, Db } from 'mongodb';

// Declare process for TypeScript
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

// MongoDB Atlas connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tambolisuhail3_db_user:9isOHM0Ay4NqTxW7@realtimeemergency.zutppat.mongodb.net/smart-campus-hub?retryWrites=true&w=majority';
const DB_NAME = 'smart-campus-hub';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<{ client: MongoClient; db: Db }>} MongoDB client and database instance
 */
export async function connectToDatabase() {
  // Check the cache first
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    // Create a new MongoClient
    const client = new MongoClient(MONGODB_URI);
    
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    // Specify which database we want to use
    const db = client.db(DB_NAME);
    
    // Cache the client and database for future use
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

/**
 * Get database instance
 * @returns {Promise<Db>} Database instance
 */
export async function getDatabase() {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Get collection instance
 * @param collectionName - Name of the collection
 * @returns {Promise<import('mongodb').Collection>} Collection instance
 */
export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

/**
 * Close MongoDB connection
 */
export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('MongoDB connection closed');
  }
}

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  NOTICES: 'notices',
  EVENTS: 'events',
  STUDENT_REGISTRATIONS: 'student-registrations'
};

// User roles
export const USER_ROLES = {
  TEACHER: 'teacher',
  STUDENT: 'student'
};

// Example user document structure
export interface User {
  _id?: string;
  username: string;
  password: string; // In a real app, this should be hashed
  role: 'teacher' | 'student';
  semester?: string;
  department?: string;
  createdAt: Date;
}

// Example notice document structure
export interface Notice {
  _id?: string;
  title: string;
  description: string;
  date: Date;
  semester?: string;
  department?: string;
  createdBy: string; // username of the teacher who created it
  createdAt: Date;
}

// Example event document structure
export interface Event {
  _id?: string;
  title: string;
  description: string;
  date: Date;
  createdBy: string; // username of the teacher who created it
  createdAt: Date;
}

// Example student registration document structure
export interface StudentRegistration {
  _id?: string;
  eventId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  email: string;
  department: string;
  semester: string;
  createdAt: Date;
}