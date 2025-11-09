import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Notice as MongoNotice, Event as MongoEvent, StudentRegistration } from './mongodb';

export interface Notice {
  _id: string;
  title: string;
  description: string;
  date: Date;
  semester?: string;
  department?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: Date;
  createdBy: string;
  createdAt: Date;
}

/**
 * Create a new notice
 * @param noticeData - Notice data
 * @returns {Promise<Notice>} Created notice
 */
export async function createNotice(noticeData: Omit<MongoNotice, '_id' | 'createdAt'>): Promise<Notice> {
  try {
    const noticesCollection = await getCollection(COLLECTIONS.NOTICES);
    
    // Create new notice object
    const newNotice: MongoNotice = {
      ...noticeData,
      createdAt: new Date()
    };
    
    // Insert notice into database
    const result = await noticesCollection.insertOne(newNotice as any);
    newNotice._id = result.insertedId.toString();
    
    return {
      _id: newNotice._id,
      title: newNotice.title,
      description: newNotice.description,
      date: newNotice.date,
      semester: newNotice.semester,
      department: newNotice.department,
      createdBy: newNotice.createdBy,
      createdAt: newNotice.createdAt
    };
  } catch (error) {
    console.error('Error creating notice:', error);
    throw new Error('Failed to create notice');
  }
}

/**
 * Get all notices
 * @returns {Promise<Notice[]>} Array of notices
 */
export async function getAllNotices(): Promise<Notice[]> {
  try {
    const noticesCollection = await getCollection(COLLECTIONS.NOTICES);
    
    const notices = await noticesCollection.find({}).sort({ date: -1 }).toArray();
    
    return notices.map(notice => ({
      _id: notice._id.toString(),
      title: notice.title,
      description: notice.description,
      date: notice.date,
      semester: notice.semester,
      department: notice.department,
      createdBy: notice.createdBy,
      createdAt: notice.createdAt
    }));
  } catch (error) {
    console.error('Error getting all notices:', error);
    throw new Error('Failed to get notices');
  }
}

/**
 * Update a notice
 * @param noticeId - Notice ID
 * @param noticeData - Updated notice data
 * @returns {Promise<Notice | null>} Updated notice or null
 */
export async function updateNotice(noticeId: string, noticeData: Partial<MongoNotice>): Promise<Notice | null> {
  try {
    const noticesCollection = await getCollection(COLLECTIONS.NOTICES);
    
    const result = await noticesCollection.updateOne(
      { _id: new ObjectId(noticeId) },
      { $set: noticeData }
    );
    
    if (result.matchedCount === 0) {
      return null;
    }
    
    const updatedNotice = await noticesCollection.findOne({ _id: new ObjectId(noticeId) });
    
    if (!updatedNotice) {
      return null;
    }
    
    return {
      _id: updatedNotice._id.toString(),
      title: updatedNotice.title,
      description: updatedNotice.description,
      date: updatedNotice.date,
      semester: updatedNotice.semester,
      department: updatedNotice.department,
      createdBy: updatedNotice.createdBy,
      createdAt: updatedNotice.createdAt
    };
  } catch (error) {
    console.error('Error updating notice:', error);
    throw new Error('Failed to update notice');
  }
}

/**
 * Delete a notice
 * @param noticeId - Notice ID
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
export async function deleteNotice(noticeId: string): Promise<boolean> {
  try {
    const noticesCollection = await getCollection(COLLECTIONS.NOTICES);
    
    const result = await noticesCollection.deleteOne({ _id: new ObjectId(noticeId) });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting notice:', error);
    throw new Error('Failed to delete notice');
  }
}

/**
 * Create a new event
 * @param eventData - Event data
 * @returns {Promise<Event>} Created event
 */
export async function createEvent(eventData: Omit<MongoEvent, '_id' | 'createdAt'>): Promise<Event> {
  try {
    const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
    
    // Create new event object
    const newEvent: MongoEvent = {
      ...eventData,
      createdAt: new Date()
    };
    
    // Insert event into database
    const result = await eventsCollection.insertOne(newEvent as any);
    newEvent._id = result.insertedId.toString();
    
    return {
      _id: newEvent._id,
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      createdBy: newEvent.createdBy,
      createdAt: newEvent.createdAt
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
}

/**
 * Get all events
 * @returns {Promise<Event[]>} Array of events
 */
export async function getAllEvents(): Promise<Event[]> {
  try {
    const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
    
    const events = await eventsCollection.find({}).sort({ date: -1 }).toArray();
    
    return events.map(event => ({
      _id: event._id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      createdBy: event.createdBy,
      createdAt: event.createdAt
    }));
  } catch (error) {
    console.error('Error getting all events:', error);
    throw new Error('Failed to get events');
  }
}

/**
 * Update an event
 * @param eventId - Event ID
 * @param eventData - Updated event data
 * @returns {Promise<Event | null>} Updated event or null
 */
export async function updateEvent(eventId: string, eventData: Partial<MongoEvent>): Promise<Event | null> {
  try {
    const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
    
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $set: eventData }
    );
    
    if (result.matchedCount === 0) {
      return null;
    }
    
    const updatedEvent = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!updatedEvent) {
      return null;
    }
    
    return {
      _id: updatedEvent._id.toString(),
      title: updatedEvent.title,
      description: updatedEvent.description,
      date: updatedEvent.date,
      createdBy: updatedEvent.createdBy,
      createdAt: updatedEvent.createdAt
    };
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event');
  }
}

/**
 * Delete an event
 * @param eventId - Event ID
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
    
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(eventId) });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event');
  }
}

/**
 * Register a student for an event
 * @param registrationData - Registration data
 * @returns {Promise<StudentRegistration>} Created registration
 */
export async function registerStudentForEvent(registrationData: Omit<StudentRegistration, '_id' | 'createdAt'>): Promise<StudentRegistration> {
  try {
    const registrationsCollection = await getCollection(COLLECTIONS.STUDENT_REGISTRATIONS);
    
    // Check if student is already registered for this event
    const existingRegistration = await registrationsCollection.findOne({ 
      eventId: registrationData.eventId, 
      studentId: registrationData.studentId 
    });
    
    if (existingRegistration) {
      throw new Error('Student already registered for this event');
    }
    
    // Create new registration object
    const newRegistration: StudentRegistration = {
      ...registrationData,
      createdAt: new Date()
    };
    
    // Insert registration into database
    const result = await registrationsCollection.insertOne(newRegistration as any);
    newRegistration._id = result.insertedId.toString();
    
    return newRegistration;
  } catch (error) {
    console.error('Error registering student for event:', error);
    throw new Error('Failed to register student for event');
  }
}

/**
 * Get all registrations for an event
 * @param eventId - Event ID
 * @returns {Promise<StudentRegistration[]>} Array of registrations
 */
export async function getEventRegistrations(eventId: string): Promise<StudentRegistration[]> {
  try {
    const registrationsCollection = await getCollection(COLLECTIONS.STUDENT_REGISTRATIONS);
    
    const registrations = await registrationsCollection.find({ eventId }).toArray();
    
    return registrations.map(registration => ({
      _id: registration._id.toString(),
      eventId: registration.eventId,
      studentId: registration.studentId,
      studentName: registration.studentName,
      rollNumber: registration.rollNumber,
      email: registration.email,
      department: registration.department,
      semester: registration.semester,
      createdAt: registration.createdAt
    }));
  } catch (error) {
    console.error('Error getting event registrations:', error);
    throw new Error('Failed to get event registrations');
  }
}