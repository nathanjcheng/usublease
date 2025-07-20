import React, { useState } from 'react';
import { signIn, fetchAuthSession } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Sign in with AWS Cognito using password auth
      const user = await signIn({ 
        username: email, 
        password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH'
        }
      });
      
      // Get the session and ID token
      const session = await fetchAuthSession();
      const idToken = session.tokens.idToken.toString();
      
      // Store the token in localStorage with safe property access
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify({
        id: user?.username || email,
        email: user?.attributes?.email || email,
        name: user?.attributes?.name || user?.attributes?.given_name || 'User'
      }));
      
      // Navigate to profile page
      navigate('/profile');
    } catch (error) {
      let message = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'UserNotFoundException':
          message = 'No account found with that email.';
          break;
        case 'NotAuthorizedException':
          message = 'Incorrect password. Please try again.';
          break;
        case 'UserNotConfirmedException':
          message = 'Please confirm your email address before logging in.';
          break;
        case 'TooManyRequestsException':
          message = 'Too many failed attempts. Please wait and try again later.';
          break;
        case 'LimitExceededException':
          message = 'Too many failed attempts. Please wait and try again later.';
          break;
        default:
          message = error.message || 'An unexpected error occurred.';
      }
      setError(message);
    } finally {
      setLoading(false);
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
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
        <p className="auth-switch">
          <a href="/forgot-password">Forgot your password?</a>
        </p>
      </div>
    </div>
  );
};

export default Login; 