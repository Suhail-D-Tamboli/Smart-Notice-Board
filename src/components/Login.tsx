import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

interface LoginProps {
  setUser: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUser(result.user);
        // Navigate to the appropriate portal based on role
        navigate(`/${role}`);
      } else {
        setError(result.message || 'Invalid username, password, or role');
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userData: any = {
        username,
        password,
        role
      };
      
      if (role === 'student') {
        userData.semester = semester;
        userData.department = department;
      }
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUser(result.user);
        // Navigate to the appropriate portal based on role
        navigate(`/${role}`);
      } else {
        setError(result.message || 'Failed to signup. Please try again.');
      }
    } catch (err: any) {
      setError('Failed to signup. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <section className="hero">
        <h1>Welcome to Smart Campus Hub</h1>
        <p>Login to continue. Teachers can manage notices and events. Students can browse notices and upcoming events effortlessly.</p>
        <div className="badges">
          <span className="badge">Fast</span>
          <span className="badge">Secure</span>
          <span className="badge">Responsive</span>
        </div>
      </section>
      <section className="card">
        <div className="modes">
          <div 
            id="modeLogin"
            className={`mode ${mode === 'login' ? 'active' : ''}`} 
            onClick={() => setMode('login')}
          >
            Login
          </div>
          <div 
            id="modeSignup"
            className={`mode ${mode === 'signup' ? 'active' : ''}`} 
            onClick={() => setMode('signup')}
          >
            Signup
          </div>
        </div>
        <div className="tabs">
          <div 
            id="tabTeacher"
            className={`tab ${role === 'teacher' ? 'active' : ''}`} 
            onClick={() => setRole('teacher')}
          >
            Teacher
          </div>
          <div 
            id="tabStudent"
            className={`tab ${role === 'student' ? 'active' : ''}`} 
            onClick={() => setRole('student')}
          >
            Student
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {mode === 'login' && role === 'teacher' && (
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="ltUsername">Username</label>
              <input 
                id="ltUsername" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>
            <div>
              <label htmlFor="ltPassword">Password</label>
              <input 
                id="ltPassword" 
                type="password" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <div className="actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login as Teacher'}
              </button>
              <span className="muted">Use your teacher credentials</span>
            </div>
          </form>
        )}

        {mode === 'login' && role === 'student' && (
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="lsUsername">Username</label>
              <input 
                id="lsUsername" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>
            <div>
              <label htmlFor="lsPassword">Password</label>
              <input 
                id="lsPassword" 
                type="password" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <div className="actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login as Student'}
              </button>
              <span className="muted">Use your student credentials</span>
            </div>
          </form>
        )}

        {mode === 'signup' && role === 'teacher' && (
          <form onSubmit={handleSignup}>
            <div>
              <label htmlFor="tUsername">Username</label>
              <input 
                id="tUsername" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>
            <div>
              <label htmlFor="tPassword">Password</label>
              <input 
                id="tPassword" 
                type="password" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <div className="actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Teacher Account'}
              </button>
              <span className="muted">You can switch to Login anytime</span>
            </div>
          </form>
        )}

        {mode === 'signup' && role === 'student' && (
          <form onSubmit={handleSignup}>
            <div>
              <label htmlFor="sUsername">Username</label>
              <input 
                id="sUsername" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>
            <div>
              <label htmlFor="sPassword">Password</label>
              <input 
                id="sPassword" 
                type="password" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <div>
              <label htmlFor="sSemester">Semester</label>
              <select 
                id="sSemester" 
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
              >
                <option value="">Select semester</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
                <option>7</option>
                <option>8</option>
              </select>
            </div>
            <div>
              <label htmlFor="sDept">Department</label>
              <select 
                id="sDept" 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">Select department</option>
                <option value="CS">Computer Science</option>
                <option value="EC">Electronics</option>
                <option value="ISE">Information Science</option>
                <option value="AIML">AI/ML</option>
                <option value="DS">Data Science</option>
                <option value="CE">Civil</option>
                <option value="ME">Mechanical</option>
              </select>
            </div>
            <div className="actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Student Account'}
              </button>
              <span className="muted">You can switch to Login anytime</span>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default Login;