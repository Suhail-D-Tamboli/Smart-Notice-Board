import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, User } from './mongodb';

/**
 * Create a new user
 * @param userData - User data
 * @returns {Promise<User>} Created user
 */
export async function createUser(userData: Omit<User, '_id' | 'createdAt'>): Promise<User> {
  try {
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username: userData.username });
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create new user object
    const newUser: User = {
      ...userData,
      createdAt: new Date()
    };
    
    // Insert user into database
    const result = await usersCollection.insertOne(newUser as any);
    newUser._id = result.insertedId.toString();
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

/**
 * Authenticate user
 * @param username - User's username
 * @param password - User's password
 * @param role - User's role
 * @returns {Promise<User | null>} Authenticated user or null
 */
export async function authenticateUser(username: string, password: string, role: string): Promise<User | null> {
  try {
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    // Find user by username, password, and role
    const user = await usersCollection.findOne({ 
      username, 
      password, // In a real app, this should be hashed
      role: role as 'teacher' | 'student'
    });
    
    if (!user) {
      return null;
    }
    
    return {
      _id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      semester: user.semester,
      department: user.department,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw new Error('Failed to authenticate user');
  }
}

/**
 * Get user by ID
 * @param userId - User ID
 * @returns {Promise<User | null>} User or null
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return null;
    }
    
    return {
      _id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      semester: user.semester,
      department: user.department,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new Error('Failed to get user');
  }
}

/**
 * Get all users
 * @returns {Promise<User[]>} Array of users
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    const users = await usersCollection.find({}).toArray();
    
    return users.map(user => ({
      _id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      semester: user.semester,
      department: user.department,
      createdAt: user.createdAt
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }
}