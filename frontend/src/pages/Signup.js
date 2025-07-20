import React, { useState } from 'react';
import { signUp, confirmSignUp, signIn, fetchAuthSession, resendSignUpCode } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const navigate = useNavigate();

  // List of universities
  const universities = [
    'University of South Florida',
    'University of Florida',
    'Florida State University',
    'University of Central Florida',
    'Florida International University',
    'University of Miami',
    'Florida Atlantic University',
    'Florida A&M University',
    'University of North Florida',
    'Florida Gulf Coast University',
    'University of West Florida',
    'Florida Polytechnic University',
    'New College of Florida',
    'Florida Southern College',
    'Stetson University'
  ];

  // Helper to format phone number
  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Helper to get raw phone number (digits only)
  const getRawPhoneNumber = (formatted) => {
    return formatted.replace(/\D/g, '');
  };

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

    // Validate phone number
    const rawPhone = getRawPhoneNumber(phone);
    if (rawPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }

    // Validate university selection
    if (!university) {
      setError('Please select your university.');
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
            given_name: firstName,
            family_name: lastName,
            name: `${firstName} ${lastName}`.trim()
          }
        }
      });

      console.log('User signed up successfully:', user);
      
      // Store additional user data in localStorage for later use
      const userData = {
        firstName,
        lastName,
        university,
        phone: getRawPhoneNumber(phone),
        email
      };
      localStorage.setItem('signupData', JSON.stringify(userData));
      
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
        name: user?.attributes?.name || user?.attributes?.given_name || `${firstName} ${lastName}`.trim()
      }));
      
      // Save additional user data to API
      try {
        const signupData = localStorage.getItem('signupData');
        if (signupData) {
          const userData = JSON.parse(signupData);
          // Import the API service
          const { userAPI } = await import('../services/api');
          await userAPI.updateProfile({
            firstName: userData.firstName,
            lastName: userData.lastName,
            university: userData.university,
            phone: userData.phone,
            name: `${userData.firstName} ${userData.lastName}`.trim()
          });
          // Clear the signup data
          localStorage.removeItem('signupData');
        }
      } catch (apiError) {
        console.log('Failed to save additional user data to API:', apiError);
        // Don't fail the signup if API call fails
      }
      
      // Navigate to profile page
      navigate('/profile');
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
            <label>First Name:</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your first name"
            />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your last name"
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
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>University:</label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
              disabled={loading}
              className="auth-select"
            >
              <option value="">Select your university</option>
              {universities.map((uni) => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Phone Number:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              required
              disabled={loading}
              placeholder="(555) 123-4567"
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