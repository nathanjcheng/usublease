import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Get the ID token
      const idToken = await user.getIdToken();
      
      // Store the token in localStorage
      localStorage.setItem('token', idToken);
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      let message = 'Login failed. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with that email.';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please wait and try again later.';
          break;
        default:
          message = error.message;
      }
      setError(message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login to USublease</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">Login</button>
        </form>
        <p className="auth-switch">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login; 