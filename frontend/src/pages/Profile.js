import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut, fetchAuthSession } from '@aws-amplify/auth';
import { userAPI } from '../services/api';
import '../App.css';
// Simple edit icon component
const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();

  // Editing states and form values
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);

  const [displayNameInput, setDisplayNameInput] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // Preset list of universities – this can be replaced or loaded dynamically later
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

  // Helper to format budget range with dollar signs
  const formatBudget = (range) => {
    if (!range) return 'Not set';
    let min = '', max = '';
    if (typeof range === 'string') {
      [min, max] = range.split('-');
    } else if (typeof range === 'object') {
      min = range.min || '';
      max = range.max || '';
    }
    if (!min && !max) return 'Not set';
    return `$${min} - $${max}`;
  };

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

  useEffect(() => {
    console.log('Profile component mounted, loading user data...');
    
    // Debug: Check what's in localStorage
    console.log('localStorage token:', localStorage.getItem('token'));
    console.log('localStorage user:', localStorage.getItem('user'));
    console.log('All localStorage keys:', Object.keys(localStorage));
    
    // Check online status
    const handleOnlineStatus = () => {
      const isCurrentlyOffline = !navigator.onLine;
      setIsOffline(isCurrentlyOffline);
      console.log('Network status changed:', isCurrentlyOffline ? 'offline' : 'online');
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    const loadUserData = async () => {
      try {
        // Get current authenticated user from Cognito
        let cognitoUser;
        try {
          cognitoUser = await getCurrentUser();
          console.log('Cognito user:', cognitoUser);
          console.log('Cognito user attributes:', cognitoUser.attributes);
        } catch (error) {
          console.error('Error getting current user:', error);
          // If getCurrentUser fails, try to get user info from session
          const session = await fetchAuthSession();
          console.log('Auth session:', session);
          
          // Create a basic user object from session data
          const basicUser = {
            id: session.tokens?.accessToken?.payload?.sub || 'unknown',
            email: session.tokens?.accessToken?.payload?.email || 'No email available',
            name: session.tokens?.accessToken?.payload?.name || 'User'
          };
          
          console.log('Created basic user from session:', basicUser);
          setUser(basicUser);
          return;
        }
        
        // Also get session info which might have more user details
        const session = await fetchAuthSession();
        console.log('Auth session:', session);
        
        // Try to get email from multiple sources
        let userEmail = 'No email available';
        let userName = 'User';
        
        console.log('Session tokens:', session.tokens);
        console.log('Access token payload:', session.tokens?.accessToken?.payload);
        console.log('ID token payload:', session.tokens?.idToken?.payload);
        
        // Try to get email from various sources
        if (cognitoUser.attributes?.email) {
          userEmail = cognitoUser.attributes.email;
          console.log('Found email in cognitoUser.attributes.email:', userEmail);
        } else if (session.tokens?.accessToken?.payload?.email) {
          userEmail = session.tokens.accessToken.payload.email;
          console.log('Found email in accessToken payload:', userEmail);
        } else if (session.tokens?.idToken?.payload?.email) {
          userEmail = session.tokens.idToken.payload.email;
          console.log('Found email in idToken payload:', userEmail);
        } else {
          // If no email in tokens, try to get from localStorage
          const storedUser = localStorage.getItem('user');
          console.log('Stored user in localStorage:', storedUser);
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log('Parsed user from localStorage:', parsedUser);
              if (parsedUser.email) {
                userEmail = parsedUser.email;
                console.log('Found email in localStorage:', userEmail);
              }
            } catch (e) {
              console.log('Error parsing stored user:', e);
            }
          }
        }
        
        // If still no email, try to get from the username (sometimes username is the email)
        if (userEmail === 'No email available' && cognitoUser.username && cognitoUser.username.includes('@')) {
          userEmail = cognitoUser.username;
          console.log('Using username as email:', userEmail);
        }
        
        // Final fallback: if we still don't have an email, try to get it from the session
        if (userEmail === 'No email available') {
          // Try to decode the ID token to get user info
          try {
            const idToken = session.tokens?.idToken?.toString();
            if (idToken) {
              const payload = JSON.parse(atob(idToken.split('.')[1]));
              console.log('Decoded ID token payload:', payload);
              if (payload.email) {
                userEmail = payload.email;
                console.log('Found email in decoded ID token:', userEmail);
              }
            }
          } catch (e) {
            console.log('Error decoding ID token:', e);
          }
        }
        
        // Try to get name from various sources
        if (cognitoUser.attributes?.name) {
          userName = cognitoUser.attributes.name;
        } else if (cognitoUser.attributes?.given_name) {
          userName = cognitoUser.attributes.given_name;
        } else if (cognitoUser.name) {
          userName = cognitoUser.name;
        }
        
        // Set basic user data from Cognito first with proper null checks
        const basicUser = {
          id: cognitoUser.username || cognitoUser.userId || 'unknown',
          email: userEmail,
          name: userName,
          // Include any other properties that might be useful
          ...cognitoUser
        };
        
        console.log('Setting basic user data:', basicUser);
        console.log('User object keys:', Object.keys(cognitoUser));
        console.log('Full user object:', JSON.stringify(cognitoUser, null, 2));
        setUser(basicUser);
        
        // Try to get additional user data from API (optional)
        try {
          const userData = await userAPI.getProfile();
          console.log('User data from API:', userData);
          
          // Combine Cognito user data with profile data
          const combinedUser = {
            ...basicUser,
            ...userData,
            name: userData.name || basicUser.name
          };
          
          setUser(combinedUser);
        } catch (apiError) {
          console.log('API call failed, using basic user data:', apiError);
          // API call failed, but we still have basic user data from Cognito
          setError('Unable to load additional profile data. Basic information is still available.');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        
        // Since ProtectedRoute handles authentication, we shouldn't get NotAuthorizedException here
        // But if we do, just show an error message
        if (error.code === 'NotAuthorizedException') {
          console.log('Unexpected authentication error');
          setError('Authentication error. Please try refreshing the page.');
        } else if (!navigator.onLine) {
          setError('You are currently offline. Please check your internet connection.');
          setIsOffline(true);
        } else {
          setError('Failed to load user data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [navigate]);

  // Sync form fields when user data changes
  useEffect(() => {
    if (user) {
      setDisplayNameInput(user.name || '');
      setSelectedUniversity(user.university || '');
      setEmailInput(user.email || '');
      setPhoneInput(formatPhoneNumber(user.phone || ''));
      setLocationInput(user.preferredLocation || '');

      if (user.budgetRange) {
        if (typeof user.budgetRange === 'string') {
          const [min = '', max = ''] = user.budgetRange.split('-');
          setBudgetMin(min);
          setBudgetMax(max);
        } else if (typeof user.budgetRange === 'object') {
          setBudgetMin(user.budgetRange.min || '');
          setBudgetMax(user.budgetRange.max || '');
        }
      }
    }
  }, [user]);

  // Helper to persist user changes to API
  const saveUserData = async (updates) => {
    try {
      await userAPI.updateProfile(updates);
      
      // Update local user state
      setUser(prev => ({ ...prev, ...updates }));
      
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      setError('Failed to save changes. Please try again.');
      return false;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  const handleSaveUniversity = async () => {
    const success = await saveUserData({ university: selectedUniversity });
    if (success) {
      setEditingHeader(false);
    }
  };

  const handleSaveContact = async () => {
    const updates = {
      name: displayNameInput,
      email: emailInput,
      phone: getRawPhoneNumber(phoneInput),
      preferredLocation: locationInput
    };
    
    const success = await saveUserData(updates);
    if (success) {
      setEditingContact(false);
    }
  };

  const handleSavePreferences = async () => {
    const budgetRange = budgetMin || budgetMax ? `${budgetMin}-${budgetMax}` : null;
    const updates = { budgetRange };
    
    const success = await saveUserData(updates);
    if (success) {
      setEditingPreferences(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Since this component is wrapped in ProtectedRoute, user should always be authenticated
  // If we somehow get here without a user, show a loading state
  if (!user) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <button onClick={handleSignOut} className="sign-out-button">
          Sign Out
        </button>
      </div>

      {/* Logged in status */}
      <div className="login-status" style={{ 
        background: '#e8f5e8', 
        border: '1px solid #4caf50', 
        borderRadius: '8px', 
        padding: '12px 16px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong style={{ color: '#2e7d32' }}>✓ Logged in as:</strong>
          <span style={{ marginLeft: '8px', color: '#1b5e20', fontWeight: '500' }}>
            {user.email}
          </span>
        </div>
        <span style={{ color: '#4caf50', fontSize: '14px' }}>
          Active Session
        </span>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {isOffline && (
        <div className="offline-message" style={{ color: 'orange', marginBottom: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          You are currently offline. Some features may not work properly.
        </div>
      )}

      <div className="profile-content">
        {/* Header Section */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Basic Information</h3>
            <button 
              onClick={() => setEditingHeader(!editingHeader)}
              className="edit-button"
            >
              <EditIcon />
            </button>
          </div>
          
          {editingHeader ? (
            <div className="edit-form">
              <div className="form-group">
                <label>University:</label>
                <select 
                  value={selectedUniversity} 
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="input-13"
                >
                  <option value="">Select University</option>
                  {universities.map((uni) => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button onClick={handleSaveUniversity} className="button-13 save">Save</button>
                <button onClick={() => setEditingHeader(false)} className="button-13">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="info-display">
              <p><strong>University:</strong> {user.university || 'Not set'}</p>
            </div>
          )}
        </div>

        {/* Contact Information Section */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Contact Information</h3>
            <button 
              onClick={() => setEditingContact(!editingContact)}
              className="edit-button"
            >
              <EditIcon />
            </button>
          </div>
          
          {editingContact ? (
            <div className="edit-form">
              <div className="form-group">
                <label>First Name:</label>
                <input 
                  type="text" 
                  value={displayNameInput.split(' ')[0] || ''} 
                  onChange={(e) => {
                    const lastName = displayNameInput.split(' ').slice(1).join(' ') || '';
                    setDisplayNameInput(`${e.target.value} ${lastName}`.trim());
                  }}
                  className="input-13"
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name:</label>
                <input 
                  type="text" 
                  value={displayNameInput.split(' ').slice(1).join(' ') || ''} 
                  onChange={(e) => {
                    const firstName = displayNameInput.split(' ')[0] || '';
                    setDisplayNameInput(`${firstName} ${e.target.value}`.trim());
                  }}
                  className="input-13"
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input 
                  type="email" 
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="input-13"
                />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input 
                  type="tel" 
                  value={phoneInput} 
                  onChange={(e) => setPhoneInput(formatPhoneNumber(e.target.value))}
                  className="input-13"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label>Preferred Location:</label>
                <input 
                  type="text" 
                  value={locationInput} 
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="input-13"
                  placeholder="City, State"
                />
              </div>
              <div className="form-actions">
                <button onClick={handleSaveContact} className="button-13 save">Save</button>
                <button onClick={() => setEditingContact(false)} className="button-13">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="info-display">
              <p><strong>Name:</strong> {user.name || 'Not set'}</p>
              <p><strong>Email:</strong> {user.email || 'Not set'}</p>
              <p><strong>Phone:</strong> {user.phone ? formatPhoneNumber(user.phone) : 'Not set'}</p>
              <p><strong>Preferred Location:</strong> {user.preferredLocation || 'Not set'}</p>
            </div>
          )}
        </div>

        {/* Preferences Section */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Preferences</h3>
            <button 
              onClick={() => setEditingPreferences(!editingPreferences)}
              className="edit-button"
            >
              <EditIcon />
            </button>
          </div>
          
          {editingPreferences ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Budget Range:</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    value={budgetMin} 
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="input-13"
                    placeholder="Min"
                    style={{ width: '100px' }}
                  />
                  <span>-</span>
                  <input 
                    type="number" 
                    value={budgetMax} 
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="input-13"
                    placeholder="Max"
                    style={{ width: '100px' }}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button onClick={handleSavePreferences} className="button-13 save">Save</button>
                <button onClick={() => setEditingPreferences(false)} className="button-13">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="info-display">
              <p><strong>Budget Range:</strong> {formatBudget(user.budgetRange)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile; 