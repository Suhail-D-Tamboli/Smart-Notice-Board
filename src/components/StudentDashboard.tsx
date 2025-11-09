import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

// Mock data for initial loading and fallback
const mockEvents = [
  {
    _id: '1',
    title: 'Tech Symposium 2023',
    date: '2023-12-15',
    venue: 'Main Auditorium',
    department: 'CS',
    semester: '5'
  },
  {
    _id: '2',
    title: 'AI Workshop',
    date: '2023-12-20',
    venue: 'Lab 301',
    department: 'CS',
    semester: '5'
  },
  {
    _id: '3',
    title: 'Career Fair',
    date: '2023-12-25',
    venue: 'Sports Complex',
    department: 'CS',
    semester: '5'
  }
];

const mockNotices = [
  {
    _id: '1',
    title: 'Final Exam Schedule Released',
    date: '2023-12-01',
    department: 'CS',
    semester: '5'
  },
  {
    _id: '2',
    title: 'Holiday Notice for New Year',
    date: '2023-12-05',
    department: 'CS',
    semester: '5'
  },
  {
    _id: '3',
    title: 'Scholarship Applications Open',
    date: '2023-12-10',
    department: 'CS',
    semester: '5'
  }
];

interface Event {
  _id: string;
  title: string;
  date: string;
  venue: string;
  department: string;
  semester: string;
}

interface Notice {
  _id: string;
  title: string;
  date: string;
  department: string;
  semester: string;
}

interface StudentDashboardProps {
  user: {
    department: string;
    semester: string;
    username: string;
  };
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [posters, setPosters] = useState<any[]>([]); // New state for posters
  const [totalEvents, setTotalEvents] = useState(0);
  const [registeredEvents, setRegisteredEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventsByMonth, setEventsByMonth] = useState<any[]>([]);

  // Fetch registered events count for the student
  const fetchRegisteredEventsCount = async () => {
    try {
      const registeredCountResponse = await fetch(`/api/students/${user.username}/registered-events-count`);
      if (registeredCountResponse.ok) {
        const { count } = await registeredCountResponse.json();
        setRegisteredEvents(count);
      }
    } catch (err) {
      console.error('Error fetching registered events count:', err);
    }
  };

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch events for student's department and semester
        const eventsResponse = await fetch(`/api/events?department=${user.department}&semester=${user.semester}`);
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
        setTotalEvents(eventsData.length);
        
        // Process events by month for chart
        const eventsByMonthData = processEventsByMonth(eventsData);
        setEventsByMonth(eventsByMonthData);
        
        // Fetch notices for student's department and semester
        const noticesResponse = await fetch(`/api/notices?department=${user.department}&semester=${user.semester}`);
        const noticesData = await noticesResponse.json();
        setNotices(noticesData);
        
        // Combine posters from both notices and events
        const allPosters = [
          ...noticesData.filter((item: any) => item.poster).map((item: any) => ({ ...item, type: 'notice' })),
          ...eventsData.filter((item: any) => item.poster).map((item: any) => ({ ...item, type: 'event' }))
        ];
        setPosters(allPosters);
        
        // Fetch registered events count for the student
        await fetchRegisteredEventsCount();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Showing mock data instead.');
        
        // Use mock data as fallback
        setEvents(mockEvents);
        setNotices(mockNotices);
        setTotalEvents(mockEvents.length);
        setRegisteredEvents(0);
        const eventsByMonthData = processEventsByMonth(mockEvents);
        setEventsByMonth(eventsByMonthData);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Listen for registration updates
    const handleRegistrationUpdate = () => {
      fetchRegisteredEventsCount();
    };
    
    window.addEventListener('registrationUpdated', handleRegistrationUpdate);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('registrationUpdated', handleRegistrationUpdate);
    };
  }, [user.department, user.semester, user.username]);
  
  // Process events by month for chart
  const processEventsByMonth = (events: Event[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const result = months.map((month, index) => {
      const count = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === index && eventDate.getFullYear() === currentYear;
      }).length;
      
      return { name: month, events: count };
    });
    
    return result;
  };
  
  // Get upcoming events (next 3)
  const upcomingEvents = events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="nav-brand">Smart Campus Hub</div>
        <div className="nav-links">
          <button className="nav-link active" onClick={() => navigate('/student/dashboard')}>
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button className="nav-link" onClick={() => navigate('/student')}>
            <span className="nav-icon">✅</span>
            My Events
          </button>
          <button className="nav-link">
            <span className="nav-icon">👤</span>
            Profile
          </button>
          <button className="nav-link" onClick={() => navigate('/')}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>
      
      {/* Welcome Banner */}
      <div className="quote-section">
        <div className="quote-content">
          <h2>🚀 Welcome back, {user.username}!</h2>
          <p className="quote-text">Learning never exhausts the mind.</p>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon events-icon">
            <span>📅</span>
          </div>
          <div className="stat-info">
            <h3>{totalEvents}</h3>
            <p>Total Events</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon upcoming-icon">
            <span>🔜</span>
          </div>
          <div className="stat-info">
            <h3>{upcomingEvents.length}</h3>
            <p>Upcoming Events</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon registered-icon">
            <span>📝</span>
          </div>
          <div className="stat-info">
            <h3>{registeredEvents}</h3>
            <p>Registered Events</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon notices-icon">
            <span>📢</span>
          </div>
          <div className="stat-info">
            <h3>{notices.length}</h3>
            <p>Department Notices</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        {/* Charts Section */}
        <div className="section">
          <h2>📈 Events Conducted per Month</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={eventsByMonth}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="events" fill="#4F46E5" name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Upcoming Events Table */}
        <div className="section">
          <h2>📅 Upcoming Events</h2>
          <div className="events-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Venue</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <tr key={event._id}>
                      <td>{event.title}</td>
                      <td>{formatDate(event.date)}</td>
                      <td>{event.venue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="no-data">No upcoming events found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* AI Posters Gallery */}
        {posters.length > 0 && (
          <div className="section">
            <h2>🎨 AI-Generated Posters</h2>
            <div className="posters-gallery">
              {posters.map((item, index) => (
                <div key={`${item._id}-${index}`} className="poster-card">
                  <img 
                    src={item.poster} 
                    alt={`${item.type} poster`}
                    className="poster-image"
                  />
                  <div className="poster-info">
                    <h3 className="poster-title">{item.title}</h3>
                    <span className={`poster-type ${item.type}`}>
                      {item.type === 'notice' ? '📢 Notice' : '📅 Event'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2025 Smart Notice & Event System | All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;