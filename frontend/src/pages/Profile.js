import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
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

  useEffect(() => {
    // Check online status
    const handleOnlineStatus = () => {
      const isCurrentlyOffline = !navigator.onLine;
      setIsOffline(isCurrentlyOffline);
      console.log('Network status changed:', isCurrentlyOffline ? 'offline' : 'online');
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      
      if (firebaseUser) {
        try {
          // Force token refresh to ensure we have a valid token
          await firebaseUser.getIdToken(true);
          console.log('Auth token refreshed successfully');
          
          console.log('Attempting to fetch user data for:', firebaseUser.uid);
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let retryCount = 0;
          const maxRetries = 3;
          
          const fetchUserData = async () => {
            try {
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('User data fetched successfully:', userData);
                setUser({ ...firebaseUser, ...userData });
              } else {
                console.log('No user document found, using basic auth data');
                setUser(firebaseUser);
              }
            } catch (err) {
              console.error('Error fetching user data:', err);
              
              // Handle specific Firestore errors
              if (err.code === 'permission-denied') {
                console.error('Permission denied - check Firestore security rules');
                setError('Permission denied. Please check your access rights or contact support.');
              } else if (err.code === 'unavailable') {
                console.error('Firestore service unavailable');
                setError('Database service is temporarily unavailable. Please try again later.');
              } else if (err.code === 'unauthenticated') {
                console.error('User not authenticated for Firestore access');
                setError('Authentication error. Please sign out and sign back in.');
              } else if (!navigator.onLine) {
                console.error('User is offline');
                setError('You are currently offline. Please check your internet connection.');
                setIsOffline(true);
              } else {
                console.error('Unknown Firestore error:', err);
                if (retryCount < maxRetries) {
                  retryCount++;
                  console.log(`Retrying user data fetch (attempt ${retryCount}/${maxRetries})...`);
                  setTimeout(fetchUserData, 1000 * retryCount);
                  return; // Don't set user or show error yet, just retry
                } else {
                  setError('Failed to load user data after multiple attempts. Please try refreshing the page.');
                }
              }
              
              // Always set basic user info from auth even if Firestore fails
              setUser(firebaseUser);
            }
          };
          
          await fetchUserData();
        } catch (err) {
          console.error('Error fetching user data:', err);
          if (!navigator.onLine) {
            setError('You are currently offline. Please check your internet connection.');
            setIsOffline(true);
          } else if (err.code === 'permission-denied') {
            setError('You do not have permission to access this data. Please try signing out and back in.');
          } else {
            setError('Failed to load user data. Please try again later.');
          }
          // Still set the basic user info from auth
          setUser(firebaseUser);
        }
      } else {
        console.log('No authenticated user, redirecting to login');
        navigate('/login');
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [navigate]);

  // Sync form fields when user data changes
  useEffect(() => {
    if (user) {
      setDisplayNameInput(user.displayName || '');
      setSelectedUniversity(user.university || '');
      setEmailInput(user.email || '');
      setPhoneInput(user.phone || '');
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

  // Helper to persist user changes to Firestore
  const saveUserData = async (updates) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, updates, { merge: true });
      setUser((prev) => ({ ...prev, ...updates }));
    } catch (err) {
      console.error('Failed to save user data:', err);
      setError('Failed to save changes. Please try again.');
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  // Save university selection to Firestore
  const handleSaveUniversity = async () => {
    if (!selectedUniversity || !user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { university: selectedUniversity });
      // Update local state
      setUser((prev) => ({ ...prev, university: selectedUniversity }));
    } catch (err) {
      // If the document doesn't exist, create it with setDoc (merge)
      if (err.code === 'not-found' || /No document to update/i.test(err.message || '')) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { university: selectedUniversity }, { merge: true });
          setUser((prev) => ({ ...prev, university: selectedUniversity }));
          return;
        } catch (setErr) {
          console.error('Failed to create user document:', setErr);
          setError('Unable to save university. Please try again later.');
          return;
        }
      }
      console.error('Failed to update university:', err);
      setError('Failed to update university. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Profile</h1>
      {error && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}
      {isOffline && (
        <div className="warning-message" style={{ color: 'orange', margin: '10px 0' }}>
          You are currently offline. Some features may be limited.
        </div>
      )}
      <div
        className="profile-container"
        style={{ maxWidth: '600px', margin: '0 auto' }}
      >
        <div
          className="profile-header"
          style={{ position:'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
        >
          {editingHeader ? (
            <>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                style={{ padding: '5px', borderRadius: '5px', fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' }}
              />
              <div className="profile-avatar" style={{ margin: '0 0 1rem' }}>👤</div>
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                style={{ padding: '5px', borderRadius: '5px', marginTop: '0.25rem' }}
              >
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: '10px', display:'flex', gap:'10px' }}>
                <button
                  onClick={async () => {
                    try {
                      await updateProfile(auth.currentUser, { displayName: displayNameInput });
                    } catch (e) {
                      console.warn('Failed to update auth profile name:', e);
                    }
                    await saveUserData({ displayName: displayNameInput, university: selectedUniversity });
                    setEditingHeader(false);
                  }}
                  style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px' }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingHeader(false)}
                  style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px' }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ margin: '0 0 0.5rem' }}>{user?.displayName || 'User'}</h2>
              <div className="profile-avatar" style={{ margin: '0 0 1rem' }}>👤</div>
              <p style={{ marginBottom: '0.5rem' }}>{user?.university || 'University not set'}</p>
              <EditIcon
                fontSize="small"
                onClick={() => {
                  setEditingHeader(true);
                  setDisplayNameInput(user?.displayName || '');
                  setSelectedUniversity(user?.university || '');
                }}
                style={{ position: 'absolute', top: 6, right: 6, cursor: 'pointer', color: '#555' }}
              />
            </>
          )}
        </div>
        <div
          className="profile-details"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '1.5rem' }}
        >
          <div
            className="info-container"
            style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%' }}
          >
            <h3 style={{ marginBottom: '1rem' }}>Contact Information</h3>
            {editingContact ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ minWidth:'100px' }}>Email:</span>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{ padding: '5px', borderRadius: '5px', flex:'1' }}
                  />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ minWidth:'100px' }}>Phone:</span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    style={{ padding: '5px', borderRadius: '5px', flex:'1' }}
                  />
                </div>
                <div style={{ marginTop: '10px', display:'flex', gap:'10px' }}>
                  <button
                    onClick={async () => {
                      await saveUserData({ email: emailInput, phone: phoneInput });
                      setEditingContact(false);
                    }}
                    style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingContact(false)}
                    style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingRight:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ minWidth:'100px' }}>Email:</span>
                  <span>{user?.email}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
                  <span style={{ minWidth:'100px' }}>Phone:</span>
                  <span>{user?.phone || 'Not set'}</span>
                </div>
                <EditIcon fontSize="small"
                  onClick={() => setEditingContact(true)}
                  style={{ position: 'absolute', top: 0, right: 0, cursor: 'pointer', color: '#555' }}
                />
              </div>
            )}
          </div>
          <div
            className="preferences-container"
            style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%' }}
          >
            <h3 style={{ marginBottom: '1rem' }}>Preferences</h3>
            {editingPreferences ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ minWidth:'150px' }}>Preferred Location:</span>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    style={{ padding: '5px', borderRadius: '5px', flex:'1' }}
                  />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ minWidth:'150px' }}>Budget Range:</span>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    style={{ padding: '5px', borderRadius: '5px', width:'80px' }}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    style={{ padding: '5px', borderRadius: '5px', width:'80px' }}
                  />
                </div>
                <div style={{ marginTop: '10px', display:'flex', gap:'10px' }}>
                  <button
                    onClick={async () => {
                      const updates = {
                        preferredLocation: locationInput,
                        budgetRange: `${budgetMin}-${budgetMax}`
                      };
                      await saveUserData(updates);
                      setEditingPreferences(false);
                    }}
                    style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingPreferences(false)}
                    style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingRight:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ minWidth:'150px' }}>Preferred Location:</span>
                  <span>{user?.preferredLocation || 'Not set'}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
                  <span style={{ minWidth:'150px' }}>Budget Range:</span>
                  <span>{user?.budgetRange ? (typeof user.budgetRange === 'string' ? user.budgetRange : `${user.budgetRange.min}-${user.budgetRange.max}`) : 'Not set'}</span>
                </div>
                <EditIcon fontSize="small"
                  onClick={() => setEditingPreferences(true)}
                  style={{ position: 'absolute', top: 0, right: 0, cursor: 'pointer', color: '#555' }}
                />
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="button-17"
            style={{ marginTop: '20px', alignSelf:'center' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile; 