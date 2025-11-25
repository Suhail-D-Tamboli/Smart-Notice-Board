import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import './TeacherPortal.css';

interface TeacherPortalProps {
  user: any;
  logout: () => void;
}

interface Notice {
  _id: string;
  title: string;
  description: string;
  date: string;
  semester?: string;
  department?: string;
  createdBy: string;
  createdAt: string;
  file?: string;
  poster?: string; // Add poster property
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
  file?: string;
  registrationFields?: string[];
  hasRegistrationForm?: boolean;
  poster?: string; // Add poster property
  semester?: string;
  department?: string;
}

interface StudentRegistration {
  _id: string;
  eventId: string;
  studentName: string;
  rollNumber: string;
  email: string;
  department: string;
  semester: string;
  createdAt: string;
  // Additional fields for registration form
  [key: string]: string;
}

const TeacherPortal: React.FC<TeacherPortalProps> = ({ user, logout }) => {
  console.log('TeacherPortal: Rendering with user:', user);
  
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<'notices' | 'events' | 'home'>('home');
  const [showNoticeSubmenu, setShowNoticeSubmenu] = useState(false);
  const [showEventSubmenu, setShowEventSubmenu] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    description: '',
    semester: '',
    department: '',
    file: null as File | null
  });
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    semester: '',
    department: '',
    file: null as File | null,
    generateRegistration: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefEvent = useRef<HTMLInputElement>(null);
  const [showEventRegistrationForm, setShowEventRegistrationForm] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<Event | null>(null);
  const [registrationFields, setRegistrationFields] = useState<string[]>([
    'Student Name',
    'Roll Number',
    'Email',
    'Department',
    'Semester'
  ]);
  const [newField, setNewField] = useState('');
  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null); // Track which item is generating poster
  const [isListening, setIsListening] = useState(false);
  const [isEventListening, setIsEventListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [eventRecognition, setEventRecognition] = useState<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false; // Only get final results
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        // Only process final results to avoid duplicates
        const lastResultIndex = event.results.length - 1;
        const lastResult = event.results[lastResultIndex];
        
        if (lastResult.isFinal) {
          const finalTranscript = lastResult[0].transcript;
          console.log('Final transcript:', finalTranscript);
          
          // Append to existing description with proper spacing
          setNoticeForm(prev => {
            const currentDescription = prev.description.trim();
            const newDescription = currentDescription 
              ? currentDescription + ' ' + finalTranscript.trim()
              : finalTranscript.trim();
            return {
              ...prev,
              description: newDescription
            };
          });
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
        } else {
          setIsListening(false);
        }
      };
      
      recognitionInstance.onend = () => {
        console.log('Recognition ended');
        // Restart if still listening
        if (isListening) {
          try {
            recognitionInstance.start();
          } catch (err) {
            console.log('Recognition restart error:', err);
            setIsListening(false);
          }
        }
      };
      
      setRecognition(recognitionInstance);
      
      // Initialize event speech recognition
      const eventRecognitionInstance = new SpeechRecognition();
      
      eventRecognitionInstance.continuous = true;
      eventRecognitionInstance.interimResults = false; // Only get final results
      eventRecognitionInstance.lang = 'en-US';
      
      eventRecognitionInstance.onresult = (event: any) => {
        // Only process final results to avoid duplicates
        const lastResultIndex = event.results.length - 1;
        const lastResult = event.results[lastResultIndex];
        
        if (lastResult.isFinal) {
          const finalTranscript = lastResult[0].transcript;
          console.log('Final transcript (event):', finalTranscript);
          
          // Append to existing description with proper spacing
          setEventForm(prev => {
            const currentDescription = prev.description.trim();
            const newDescription = currentDescription 
              ? currentDescription + ' ' + finalTranscript.trim()
              : finalTranscript.trim();
            return {
              ...prev,
              description: newDescription
            };
          });
        }
      };
      
      eventRecognitionInstance.onerror = (event: any) => {
        console.error('Event speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
        } else {
          setIsEventListening(false);
        }
      };
      
      eventRecognitionInstance.onend = () => {
        console.log('Event recognition ended');
        // Restart if still listening
        if (isEventListening) {
          try {
            eventRecognitionInstance.start();
          } catch (err) {
            console.log('Event recognition restart error:', err);
            setIsEventListening(false);
          }
        }
      };
      
      setEventRecognition(eventRecognitionInstance);
    }
  }, [isListening, isEventListening]);

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting recognition:', err);
        alert('Failed to start speech recognition. Please try again.');
      }
    }
  };
  
  // Toggle event speech recognition
  const toggleEventSpeechRecognition = () => {
    if (!eventRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (isEventListening) {
      eventRecognition.stop();
      setIsEventListening(false);
    } else {
      try {
        eventRecognition.start();
        setIsEventListening(true);
      } catch (err) {
        console.error('Error starting event recognition:', err);
        alert('Failed to start speech recognition. Please try again.');
      }
    }
  };
  // Fetch data from API
  useEffect(() => {
    console.log('TeacherPortal: Fetching data');
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch notices
        const noticesResponse = await fetch('/api/notices');
        const noticesData = await noticesResponse.json();
        console.log('TeacherPortal: Notices data:', noticesData);
        
        // Fetch events
        const eventsResponse = await fetch('/api/events');
        const eventsData = await eventsResponse.json();
        console.log('TeacherPortal: Events data:', eventsData);
        
        // Handle different response formats
        const noticesArray = Array.isArray(noticesData) 
          ? noticesData 
          : (noticesData.notices || []);
        const eventsArray = Array.isArray(eventsData) 
          ? eventsData 
          : (eventsData.events || []);
        
        setNotices(noticesArray);
        setEvents(eventsArray);
      } catch (err) {
        setError('Failed to load data');
        console.error('TeacherPortal: Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch registrations for a specific event
  const fetchRegistrations = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations`);
      const data = await response.json();
      console.log('TeacherPortal: Registrations data:', data);
      setRegistrations(data);
      setSelectedEventId(eventId);
      setShowRegistrations(true);
    } catch (err) {
      setError('Failed to load registrations');
      console.error('TeacherPortal: Error fetching registrations:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleSubmenu = (menu: 'noticeSub' | 'eventSub') => {
    if (menu === 'noticeSub') {
      setShowNoticeSubmenu(!showNoticeSubmenu);
      setShowEventSubmenu(false);
    } else {
      setShowEventSubmenu(!showEventSubmenu);
      setShowNoticeSubmenu(false);
    }
  };

  const showAddNoticeForm = () => {
    setActiveMenu('notices');
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      description: '',
      semester: '',
      department: '',
      file: null
    });
  };

  const showAddEventForm = () => {
    setActiveMenu('events');
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      date: '',
      semester: '',
      department: '',
      file: null,
      generateRegistration: false
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, formType: 'notice' | 'event') => {
    if (e.target.files && e.target.files.length > 0) {
      if (formType === 'notice') {
        setNoticeForm({ ...noticeForm, file: e.target.files[0] });
      } else {
        setEventForm({ ...eventForm, file: e.target.files[0] });
      }
    }
  };

  const triggerFileInput = (formType: 'notice' | 'event') => {
    if (formType === 'notice' && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (formType === 'event' && fileInputRefEvent.current) {
      fileInputRefEvent.current.click();
    }
  };

  const saveNotice = async () => {
    if (!noticeForm.title || !noticeForm.description) {
      alert('Please fill in the notice title and description.');
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', noticeForm.title);
      formData.append('description', noticeForm.description);
      formData.append('semester', noticeForm.semester);
      formData.append('department', noticeForm.department);
      formData.append('createdBy', user.username);
      
      if (noticeForm.file) {
        formData.append('file', noticeForm.file);
      }

      const url = editingNotice ? `/api/notices/${editingNotice._id}` : '/api/notices';
      const method = editingNotice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        // Refresh notices
        const noticesResponse = await fetch('/api/notices');
        const noticesData = await noticesResponse.json();
        setNotices(noticesData.notices || noticesData || []);

        // Reset form
        setNoticeForm({
          title: '',
          description: '',
          semester: '',
          department: '',
          file: null
        });
        setEditingNotice(null);
        
        // Show success message
        alert('Notice saved successfully! AI poster generation has started in the background.');
      } else {
        throw new Error('Failed to save notice');
      }
    } catch (err) {
      setError('Failed to save notice');
      console.error('TeacherPortal: Error saving notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.description || !eventForm.date) {
      alert('Please fill in all event details.');
      return;
    }

    try {
      setLoading(true);
      
      // Create event data as JSON
      const eventData: any = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        location: '', // Add location field
        semester: eventForm.semester || '',
        department: eventForm.department || '',
        createdBy: user.username
      };
      
      if (eventForm.generateRegistration) {
        // Generate AI registration form fields
        const defaultFields = ['Student Name', 'Roll Number', 'Email', 'Department', 'Semester'];
        eventData.registrationFields = defaultFields;
      }

      const url = editingEvent ? `/api/events/${editingEvent._id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        // Refresh events
        const eventsResponse = await fetch('/api/events');
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || eventsData || []);

        // Reset form
        setEventForm({
          title: '',
          description: '',
          date: '',
          semester: '',
          department: '',
          file: null,
          generateRegistration: false
        });
        setEditingEvent(null);
        
        // Show success message
        alert('Event saved successfully! AI poster generation has started in the background.');
      } else {
        throw new Error('Failed to save event');
      }
    } catch (err) {
      setError('Failed to save event');
      console.error('TeacherPortal: Error saving event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      try {
        setLoading(true);
        console.log('Deleting notice with ID:', id);
        const response = await fetch(`/api/notices/${id}`, {
          method: 'DELETE',
        });
        
        console.log('Delete response status:', response.status);
        
        if (response.ok) {
          console.log('Notice deleted successfully');
          setNotices(notices.filter(n => n._id !== id));
        } else {
          const errorData = await response.json();
          console.error('Delete notice error:', errorData);
          setError(`Failed to delete notice: ${errorData.message || 'Unknown error'}`);
        }
      } catch (err) {
        setError('Failed to delete notice');
        console.error('TeacherPortal: Error deleting notice:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        setLoading(true);
        console.log('Deleting event with ID:', id);
        const response = await fetch(`/api/events/${id}`, {
          method: 'DELETE',
        });
        
        console.log('Delete response status:', response.status);
        
        if (response.ok) {
          console.log('Event deleted successfully');
          setEvents(events.filter(e => e._id !== id));
          // Also hide registrations if deleting the selected event
          if (selectedEventId === id) {
            setShowRegistrations(false);
            setSelectedEventId(null);
          }
        } else {
          const errorData = await response.json();
          console.error('Delete event error:', errorData);
          setError(`Failed to delete event: ${errorData.message || 'Unknown error'}`);
        }
      } catch (err) {
        setError('Failed to delete event');
        console.error('TeacherPortal: Error deleting event:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const editNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      description: notice.description,
      semester: notice.semester || '',
      department: notice.department || '',
      file: null
    });
    showAddNoticeForm();
  };

  const editEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().split('T')[0],
      semester: event.semester || '',
      department: event.department || '',
      file: null,
      generateRegistration: false
    });
    showAddEventForm();
  };

  const generateCanvaImage = (notice: Notice) => {
    // This is a placeholder for the Canva image generation
    // In a real implementation, you would integrate with Canva's API
    alert(`Generating Canva image for notice: ${notice.title}\n\nThis would integrate with Canva's API in a real implementation.`);
  };

  // Function to generate AI registration form
  const generateAIRegistrationForm = (event: Event) => {
    setSelectedEventForRegistration(event);
    setShowEventRegistrationForm(true);
    // Set default fields if none exist
    if (event.registrationFields && event.registrationFields.length > 0) {
      setRegistrationFields(event.registrationFields);
    } else {
      setRegistrationFields([
        'Student Name',
        'Roll Number',
        'Email',
        'Department',
        'Semester'
      ]);
    }
  };

  // Function to add a new field to the registration form
  const addField = () => {
    if (newField.trim() !== '') {
      setRegistrationFields([...registrationFields, newField.trim()]);
      setNewField('');
    }
  };

  // Function to remove a field from the registration form
  const removeField = (index: number) => {
    const updatedFields = [...registrationFields];
    updatedFields.splice(index, 1);
    setRegistrationFields(updatedFields);
  };

  // Function to save the registration form
  const saveRegistrationForm = async () => {
    if (!selectedEventForRegistration) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/events/${selectedEventForRegistration._id}/registration-form`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrationFields }),
      });

      if (response.ok) {
        // Update events list
        const eventsResponse = await fetch('/api/events');
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
        
        setShowEventRegistrationForm(false);
        setSelectedEventForRegistration(null);
      } else {
        throw new Error('Failed to save registration form');
      }
    } catch (err) {
      setError('Failed to save registration form');
      console.error('TeacherPortal: Error saving registration form:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate AI poster for notices and events
  const generateAIPoster = async (item: Notice | Event, type: 'notice' | 'event') => {
    try {
      setGeneratingPoster(item._id);
      
      // In a real implementation, this would call an AI service to generate a poster
      // For now, we'll simulate this with a placeholder
      const response = await fetch(`/api/${type}s/${item._id}/generate-poster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          type: type
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the local state with the poster URL
        if (type === 'notice') {
          setNotices(notices.map(n => 
            n._id === item._id ? {...n, poster: result.posterUrl} : n
          ));
        } else {
          setEvents(events.map(e => 
            e._id === item._id ? {...e, poster: result.posterUrl} : e
          ));
        }
      } else {
        throw new Error('Failed to generate poster');
      }
    } catch (err) {
      setError('Failed to generate poster');
      console.error('TeacherPortal: Error generating poster:', err);
    } finally {
      setGeneratingPoster(null);
    }
  };

  const filteredNotices = notices.filter(n => 
    (n.title && n.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (n.description && n.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEvents = events.filter(e => 
    (e.title && e.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Use central logout passed from App

  return (
    <div className="teacher-portal">
      <div className="sidebar">
        <h2>Teachers Portal</h2>
        <div style={{ padding: '0 16px 16px 16px', fontSize: '14px', color: 'var(--muted)' }}>
          <div>Welcome, {user.name}</div>
        </div>
        <div className="menu-item" onClick={() => setActiveMenu('home')}>Home</div>
        <div className="menu-item" onClick={() => toggleSubmenu('noticeSub')}>Notices</div>
        {showNoticeSubmenu && (
          <div className="submenu show">
            <button onClick={showAddNoticeForm}>Add Notice</button>
            <button onClick={() => alert('Click on any notice to edit it.')}>Edit Notice</button>
          </div>
        )}
        <div className="menu-item" onClick={() => toggleSubmenu('eventSub')}>Events</div>
        {showEventSubmenu && (
          <div className="submenu show">
            <button onClick={showAddEventForm}>Add Event</button>
            <button onClick={() => alert('Click on any event to edit it.')}>Edit Event</button>
          </div>
        )}
        <div className="menu-item logout-item" onClick={() => { logout(); navigate('/'); }} style={{ marginTop: 'auto', color: '#dc3545', cursor: 'pointer' }}>
          Logout
        </div>
      </div>

      <div className="main">
        <div className="toolbar">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search notices and events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        
        <div className="content">
          {error && <div className="error">{error}</div>}
          
          {/* Event Registration Form Modal */}
          {showEventRegistrationForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>AI Registration Form for "{selectedEventForRegistration?.title}"</h3>
                <p>Add or remove fields for the registration form:</p>
                
                <div className="form-fields">
                  {registrationFields.map((field, index) => (
                    <div key={index} className="field-item">
                      <input 
                        type="text" 
                        value={field} 
                        readOnly 
                        className="field-input"
                      />
                      <button 
                        onClick={() => removeField(index)}
                        className="remove-field-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="add-field-section">
                  <input 
                    type="text" 
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    placeholder="Add new field (e.g., Phone Number, USN, etc.)"
                    className="new-field-input"
                  />
                  <button onClick={addField} className="add-field-btn">
                    Add Field
                  </button>
                </div>
                
                <div className="modal-actions">
                  <button onClick={saveRegistrationForm} disabled={loading} className="save-btn">
                    {loading ? 'Saving...' : 'Save Registration Form'}
                  </button>
                  <button 
                    onClick={() => {
                      setShowEventRegistrationForm(false);
                      setSelectedEventForRegistration(null);
                    }} 
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Notice Form */}
          {(activeMenu === 'notices' || editingNotice) && (
            <div className="add-notice-form">
              <h3>{editingNotice ? 'Edit Notice' : 'Add Notice'}</h3>
              <input 
                type="text" 
                placeholder="Notice Title" 
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})}
              />
              <div style={{ position: 'relative' }}>
                <textarea 
                  placeholder="Notice Description (You can also speak to add text)" 
                  rows={4}
                  value={noticeForm.description}
                  onChange={(e) => setNoticeForm({...noticeForm, description: e.target.value})}
                  style={{ paddingRight: '50px' }}
                />
                <button 
                  type="button"
                  onClick={toggleSpeechRecognition}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '10px',
                    background: isListening ? '#ef4444' : '#4361ee',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  title={isListening ? 'Stop listening' : 'Start speech-to-text'}
                >
                  {isListening ? '⏸' : '🎤'}
                </button>
              </div>
              {isListening && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '5px' }}>
                  🔴 Listening... Speak now
                </p>
              )}
              <select 
                value={noticeForm.semester}
                onChange={(e) => setNoticeForm({...noticeForm, semester: e.target.value})}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num.toString()}>Semester {num}</option>
                ))}
              </select>
              <select 
                value={noticeForm.department}
                onChange={(e) => setNoticeForm({...noticeForm, department: e.target.value})}
              >
                <option value="">Select Department</option>
                <option value="CS">Computer Science</option>
                <option value="EC">Electronics</option>
                <option value="ISE">Information Science</option>
                <option value="AIML">AI/ML</option>
                <option value="DS">Data Science</option>
                <option value="CE">Civil</option>
                <option value="ME">Mechanical</option>
              </select>
              <button type="button" onClick={() => triggerFileInput('notice')}>
                Choose File
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }} 
                onChange={(e) => handleFileChange(e, 'notice')}
              />
              {noticeForm.file && <p>Selected file: {noticeForm.file.name}</p>}
              <button onClick={saveNotice} disabled={loading}>
                {loading ? 'Saving...' : (editingNotice ? 'Update Notice' : 'Upload Notice')}
              </button>
            </div>
          )}

          {/* Add Event Form */}
          {(activeMenu === 'events' || editingEvent) && (
            <div className="add-notice-form">
              <h3>{editingEvent ? 'Edit Event' : 'Add Event'}</h3>
              <input 
                type="text" 
                placeholder="Event Title" 
                value={eventForm.title}
                onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              />
              <div style={{ position: 'relative' }}>
                <textarea 
                  placeholder="Event Description (You can also speak to add text)" 
                  rows={4}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  style={{ paddingRight: '50px' }}
                />
                <button 
                  type="button"
                  onClick={toggleEventSpeechRecognition}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '10px',
                    background: isEventListening ? '#ef4444' : '#4361ee',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  title={isEventListening ? 'Stop listening' : 'Start speech-to-text'}
                >
                  {isEventListening ? '⏸' : '🎤'}
                </button>
              </div>
              {isEventListening && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '5px' }}>
                  🔴 Listening... Speak now
                </p>
              )}
              <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block'}}>Event Date:</label>
              <input 
                type="date" 
                value={eventForm.date}
                onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
              />
              <select 
                value={eventForm.semester || ''}
                onChange={(e) => setEventForm({...eventForm, semester: e.target.value})}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num.toString()}>Semester {num}</option>
                ))}
              </select>
              <select 
                value={eventForm.department || ''}
                onChange={(e) => setEventForm({...eventForm, department: e.target.value})}
              >
                <option value="">Select Department</option>
                <option value="CS">Computer Science</option>
                <option value="EC">Electronics</option>
                <option value="ISE">Information Science</option>
                <option value="AIML">AI/ML</option>
                <option value="DS">Data Science</option>
                <option value="CE">Civil</option>
                <option value="ME">Mechanical</option>
              </select>
              <button type="button" onClick={() => triggerFileInput('event')}>
                Choose File
              </button>
              <input 
                type="file" 
                ref={fileInputRefEvent}
                style={{ display: 'none' }} 
                onChange={(e) => handleFileChange(e, 'event')}
              />
              {eventForm.file && <p>Selected file: {eventForm.file.name}</p>}
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={eventForm.generateRegistration}
                    onChange={(e) => setEventForm({...eventForm, generateRegistration: e.target.checked})}
                  />
                  Generate AI Registration Form
                </label>
              </div>
              <button onClick={saveEvent} disabled={loading}>
                {loading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Upload Event')}
              </button>
            </div>
          )}

          {/* Notices List */}
          {activeMenu === 'home' && !showRegistrations && (
            <div className="notice-list">
              <h3>Notices</h3>
              {loading ? (
                <div className="empty">Loading...</div>
              ) : filteredNotices.length === 0 ? (
                <div className="empty">No notices found.</div>
              ) : (
                filteredNotices.map(notice => (
                  <div className="notice-item" key={notice._id}>
                    <div className="notice-header">
                      <span className="notice-title">{notice.title}</span>
                      <span className="notice-date">{new Date(notice.date).toLocaleDateString()}</span>
                    </div>
                    <p>{notice.description}</p>
                    {(notice.semester || notice.department) && (
                      <div className="meta" style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {notice.semester && <span className="badge">Sem {String(notice.semester).replace('sem', '')}</span>}
                        {notice.department && <span className="badge">{String(notice.department).toUpperCase()}</span>}
                      </div>
                    )}
                    <div className="action-btns">
                      <button onClick={() => handleDeleteNotice(notice._id)}>Delete</button>
                      <button onClick={() => editNotice(notice)}>Edit</button>
                      <button onClick={() => generateCanvaImage(notice)}>Generate Canva Image</button>
                      <button 
                        onClick={() => generateAIPoster(notice, 'notice')}
                        disabled={generatingPoster === notice._id}
                      >
                        {generatingPoster === notice._id ? 'Generating...' : 'Generate AI Poster'}
                      </button>
                    </div>
                    
                    {/* Display poster if available */}
                    {notice.poster && (
                      <div className="poster-preview">
                        <img 
                          src={notice.poster} 
                          alt="Generated poster" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            marginTop: '15px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                          }} 
                        />
                        <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--muted)' }}>
                          AI-generated poster for this notice
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Events List */}
          {activeMenu === 'home' && !showRegistrations && (
            <div id="eventsContainer">
              <h3>Events</h3>
              {loading ? (
                <div className="empty">Loading...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="empty">No events found.</div>
              ) : (
                filteredEvents.map(event => (
                  <div className="event-item" key={event._id}>
                    <div className="event-header">
                      <span className="event-title">{event.title}</span>
                      <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <p className="event-desc">{event.description}</p>
                    <div className="action-btns">
                      <button onClick={() => handleDeleteEvent(event._id)}>Delete</button>
                      <button onClick={() => editEvent(event)}>Edit</button>
                      <button onClick={() => fetchRegistrations(event._id)}>View Registrations</button>
                      <button onClick={() => generateAIRegistrationForm(event)}>
                        {event.hasRegistrationForm || (event.registrationFields && event.registrationFields.length > 0) 
                          ? 'Edit Registration Form' 
                          : 'Generate AI Registration Form'}
                      </button>
                      <button 
                        onClick={() => generateAIPoster(event, 'event')}
                        disabled={generatingPoster === event._id}
                      >
                        {generatingPoster === event._id ? 'Generating...' : 'Generate AI Poster'}
                      </button>
                    </div>
                    
                    {/* Display poster if available */}
                    {event.poster && (
                      <div className="poster-preview">
                        <img 
                          src={event.poster} 
                          alt="Generated poster" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            marginTop: '15px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                          }} 
                        />
                        <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--muted)' }}>
                          AI-generated poster for this event
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Student Registrations */}
          {showRegistrations && (
            <div className="registrations-section">
              <div className="registrations-header">
                <h3>Registered Students</h3>
                <button onClick={() => setShowRegistrations(false)}>Back to Events</button>
              </div>
              {loading ? (
                <div className="empty">Loading registrations...</div>
              ) : registrations.length === 0 ? (
                <div className="empty">No student registrations found.</div>
              ) : (
                <div className="registrations-grid">
                  {/* Column Headers */}
                  <div className="student-card-header">
                    <div className="student-details-container">
                      <div className="student-detail">
                        <span className="student-detail-label">👤 Name</span>
                      </div>
                      <div className="student-detail">
                        <span className="student-detail-label">🎓 Roll No</span>
                      </div>
                      <div className="student-detail">
                        <span className="student-detail-label">📧 Email</span>
                      </div>
                      <div className="student-detail">
                        <span className="student-detail-label">🏫 Department</span>
                      </div>
                      <div className="student-detail">
                        <span className="student-detail-label">📚 Semester</span>
                      </div>
                      <div className="student-detail">
                        <span className="student-detail-label">🗓️ Date</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Student Rows */}
                  {registrations.map(reg => (
                    <div className="student-card" key={reg._id}>
                      <div className="student-details-container">
                        <div className="student-detail">
                          <span className="student-detail-value">{reg.studentName}</span>
                        </div>
                        <div className="student-detail">
                          <span className="student-detail-value">{reg.rollNumber}</span>
                        </div>
                        <div className="student-detail">
                          <span className="student-detail-value">{reg.email}</span>
                        </div>
                        <div className="student-detail">
                          <span className="student-detail-value">{reg.department}</span>
                        </div>
                        <div className="student-detail">
                          <span className="student-detail-value">{reg.semester}</span>
                        </div>
                        <div className="student-detail">
                          <span className="student-detail-value">{new Date(reg.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default TeacherPortal;