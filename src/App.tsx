import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StudentPortal from './components/StudentPortal';
import StudentDashboard from './components/StudentDashboard';
import TeacherPortal from './components/TeacherPortal';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    console.log('App: User state changed:', user);
  }, [user]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            user ? (
              <div>
                <p>Redirecting to {user.role} portal...</p>
                <Navigate to={`/${user.role}`} replace />
              </div>
            ) : (
              <Login setUser={setUser} />
            )
          } />
          <Route path="/student" element={
            user?.role === 'student' ? (
              <StudentPortal user={user} />
            ) : (
              <div>
                <p>Access denied or not logged in as student. Redirecting to login...</p>
                <Navigate to="/" replace />
              </div>
            )
          } />
          <Route path="/student/dashboard" element={
            user?.role === 'student' ? (
              <StudentDashboard user={user} />
            ) : (
              <div>
                <p>Access denied or not logged in as student. Redirecting to login...</p>
                <Navigate to="/" replace />
              </div>
            )
          } />
          <Route path="/teacher" element={
            user?.role === 'teacher' ? (
              <TeacherPortal user={user} />
            ) : (
              <div>
                <p>Access denied or not logged in as teacher. Redirecting to login...</p>
                <Navigate to="/" replace />
              </div>
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;