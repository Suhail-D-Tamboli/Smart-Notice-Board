import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StudentPortal from './components/StudentPortal';
import StudentDashboard from './components/StudentDashboard';
import TeacherPortal from './components/TeacherPortal';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(() => {
    // Load user from localStorage on initial render
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    console.log('App: User state changed:', user);
    // Save user to localStorage whenever it changes
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Central logout handler passed to portals
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <Routes>
          <Route path="/" element={
            user ? (
              <Navigate to={`/${user.role}`} replace />
            ) : (
              <Login setUser={setUser} />
            )
          } />
          <Route path="/student" element={
            user?.role === 'student' ? (
              <StudentPortal user={user} logout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }>
            <Route path="dashboard" element={
              user?.role === 'student' ? (
                <StudentDashboard user={user} />
              ) : (
                <Navigate to="/" replace />
              )
            } />
          </Route>
          <Route path="/teacher" element={
            user?.role === 'teacher' ? (
              <TeacherPortal user={user} logout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;