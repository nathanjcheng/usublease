import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut } from '@aws-amplify/auth';
import { userAPI } from '../services/api';
import EditIcon from '@mui/icons-material/Edit';

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
        const cognitoUser = await getCurrentUser();
        console.log('Cognito user:', cognitoUser);
        
        // Get additional user data from API
        const userData = await userAPI.getProfile();
        console.log('User data from API:', userData);
        
        // Combine Cognito user data with profile data
        const combinedUser = {
          ...cognitoUser,
          ...userData,
          id: cognitoUser.username,
          email: cognitoUser.attributes.email,
          name: cognitoUser.attributes.name || userData.name || cognitoUser.attributes.given_name
        };
        
        setUser(combinedUser);
      } catch (error) {
        console.error('Error loading user data:', error);
        
        if (error.code === 'NotAuthorizedException') {
          console.log('User not authenticated, redirecting to login');
          navigate('/login');
          return;
        }
        
        if (!navigator.onLine) {
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

  if (!user) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Please log in to view your profile.</p>
          <button onClick={() => navigate('/login')} className="button-13">
            Go to Login
          </button>
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
                <label>Name:</label>
                <input 
                  type="text" 
                  value={displayNameInput} 
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="input-13"
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