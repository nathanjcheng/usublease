import React, { useState } from 'react';
import { signUp, confirmSignUp, signIn, fetchAuthSession, resendSignUpCode } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Sign up with AWS Cognito
      const { user } = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: name,
            given_name: name.split(' ')[0],
            family_name: name.split(' ').slice(1).join(' ') || ''
          }
        }
      });

      console.log('User signed up successfully:', user);
      setShowConfirmation(true);
    } catch (error) {
      let message = 'Sign up failed. Please try again.';
      
      switch (error.code) {
        case 'UsernameExistsException':
          message = 'An account with this email already exists.';
          break;
        case 'InvalidPasswordException':
          message = 'Password does not meet requirements.';
          break;
        case 'InvalidParameterException':
          message = 'Please check your email format.';
          break;
        default:
          message = error.message || 'An unexpected error occurred.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Confirm sign up
      await confirmSignUp({ username: email, confirmationCode });
      
      // Sign in the user with password auth
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
        name: user?.attributes?.name || user?.attributes?.given_name || name
      }));
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      let message = 'Confirmation failed. Please try again.';
      
      switch (error.code) {
        case 'CodeMismatchException':
          message = 'Invalid confirmation code. Please check your email.';
          break;
        case 'ExpiredCodeException':
          message = 'Confirmation code has expired. Please request a new one.';
          break;
        default:
          message = error.message || 'An unexpected error occurred.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({ username: email });
      alert('Confirmation code has been resent to your email.');
    } catch (error) {
      setError('Failed to resend confirmation code. Please try again.');
    }
  };

  if (showConfirmation) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h2>Confirm Your Email</h2>
          <p>We've sent a confirmation code to your email address. Please enter it below.</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleConfirmation}>
            <div className="form-group">
              <label>Confirmation Code:</label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter 6-digit code"
              />
            </div>
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Confirming...' : 'Confirm Email'}
            </button>
          </form>
          <p className="auth-switch">
            Didn't receive the code? <button onClick={handleResendCode} className="link-button">Resend Code</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Sign Up for USublease</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
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
              minLength="8"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength="8"
            />
          </div>
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup; 