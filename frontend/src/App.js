import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './App.css';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Map from './pages/Map';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Upload from './pages/Upload';
import mailIcon from './assets/images/mail.png';
import profileIcon from './assets/images/profile.png';
import searchPng from './assets/images/search.png';
import icon from './icon.png';
import settingsIcon from './assets/images/settings.png';

// Example listings data
const exampleListings = [
  // USF Listings
  {
    id: 1,
    title: "Cozy Studio near USF",
    price: "$800/month",
    semester: "Fall 2024",
    university: "University of South Florida",
    address: "1234 University Dr, Tampa, FL 33612",
    description: "Modern studio apartment within walking distance to USF campus. Recently renovated with new appliances.",
    amenities: ["Furnished", "W/D in unit", "Parking included"],
    coordinates: { lat: 28.0587, lng: -82.4139 },
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop"
  },
  {
    id: 2,
    title: "2BR Apartment - USF Area",
    price: "$1200/month",
    semester: "Fall 2024",
    university: "University of South Florida",
    address: "5678 Bruce B Downs Blvd, Tampa, FL 33612",
    description: "Spacious 2-bedroom apartment in a quiet neighborhood. Close to USF and shopping centers.",
    amenities: ["Furnished", "Pool", "Gym access"],
    coordinates: { lat: 28.0627, lng: -82.4139 },
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop"
  },
  {
    id: 3,
    title: "Luxury 1BR - USF Village",
    price: "$950/month",
    semester: "Fall 2024",
    university: "University of South Florida",
    address: "9012 Fowler Ave, Tampa, FL 33612",
    description: "Luxury 1-bedroom apartment in USF Village. Modern amenities and great location.",
    amenities: ["Furnished", "W/D in unit", "24/7 Security"],
    coordinates: { lat: 28.0647, lng: -82.4139 },
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop"
  },
  {
    id: 4,
    title: "3BR House - USF North",
    price: "$1800/month",
    semester: "Fall 2024",
    university: "University of South Florida",
    address: "3456 42nd St, Tampa, FL 33613",
    description: "Large 3-bedroom house perfect for roommates. Spacious backyard and garage.",
    amenities: ["Furnished", "Backyard", "Garage"],
    coordinates: { lat: 28.0667, lng: -82.4139 },
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop"
  },
  {
    id: 5,
    title: "Studio Loft - USF East",
    price: "$750/month",
    semester: "Fall 2024",
    university: "University of South Florida",
    address: "7890 56th St, Tampa, FL 33617",
    description: "Modern studio loft with high ceilings. Close to USF and public transportation.",
    amenities: ["Furnished", "High ceilings", "Bike storage"],
    coordinates: { lat: 28.0687, lng: -82.4139 },
    image: "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=500&h=300&fit=crop"
  },
  {
    id: 6,
    title: "4BR House - USF South",
    price: "$2200/month",
    semester: "Fall 2024",
    university: "University of South Florida",
    address: "2345 30th St, Tampa, FL 33612",
    description: "Large 4-bedroom house perfect for a group of students. Close to campus and amenities.",
    amenities: ["Furnished", "Large backyard", "2-car garage"],
    coordinates: { lat: 28.0707, lng: -82.4139 },
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop"
  },

  // UCF Listings
  {
    id: 7,
    title: "Modern 1BR - UCF Area",
    price: "$850/month",
    semester: "Fall 2024",
    university: "University of Central Florida",
    address: "1234 University Blvd, Orlando, FL 32816",
    description: "Modern 1-bedroom apartment near UCF campus. Recently renovated with new appliances.",
    amenities: ["Furnished", "W/D in unit", "Pool access"],
    coordinates: { lat: 28.6024, lng: -81.2001 },
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop"
  },
  {
    id: 8,
    title: "2BR Apartment - UCF East",
    price: "$1100/month",
    semester: "Fall 2024",
    university: "University of Central Florida",
    address: "5678 Alafaya Trail, Orlando, FL 32826",
    description: "Spacious 2-bedroom apartment in a quiet neighborhood. Close to UCF and shopping.",
    amenities: ["Furnished", "Gym access", "Parking included"],
    coordinates: { lat: 28.6044, lng: -81.2001 },
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop"
  },
  {
    id: 9,
    title: "3BR House - UCF North",
    price: "$1600/month",
    semester: "Fall 2024",
    university: "University of Central Florida",
    address: "9012 Colonial Dr, Orlando, FL 32817",
    description: "Large 3-bedroom house perfect for roommates. Spacious backyard and modern amenities.",
    amenities: ["Furnished", "Backyard", "Garage"],
    coordinates: { lat: 28.6064, lng: -81.2001 },
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop"
  },
  {
    id: 10,
    title: "Studio - UCF West",
    price: "$700/month",
    semester: "Fall 2024",
    university: "University of Central Florida",
    address: "3456 University Blvd, Orlando, FL 32816",
    description: "Cozy studio apartment within walking distance to UCF campus. Recently renovated.",
    amenities: ["Furnished", "W/D in unit", "Bike storage"],
    coordinates: { lat: 28.6084, lng: -81.2001 },
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop"
  },
  {
    id: 11,
    title: "4BR House - UCF South",
    price: "$2000/month",
    semester: "Fall 2024",
    university: "University of Central Florida",
    address: "7890 Alafaya Trail, Orlando, FL 32826",
    description: "Large 4-bedroom house perfect for a group of students. Close to campus and amenities.",
    amenities: ["Furnished", "Large backyard", "2-car garage"],
    coordinates: { lat: 28.6104, lng: -81.2001 },
    image: "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=500&h=300&fit=crop"
  },
  {
    id: 12,
    title: "Luxury 2BR - UCF Central",
    price: "$1300/month",
    semester: "Fall 2024",
    university: "University of Central Florida",
    address: "1234 University Blvd, Orlando, FL 32816",
    description: "Luxury 2-bedroom apartment with modern amenities. Perfect for students.",
    amenities: ["Furnished", "Pool", "Gym access"],
    coordinates: { lat: 28.6124, lng: -81.2001 },
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop"
  }
];

const universities = [
  "University of South Florida",
  "University of Central Florida"
];

const semesters = [
  "Fall 2024 (August-December)",
  "Spring 2025 (January-May)",
  "Summer 2025 (May-August)",
  "Fall 2025 (August-December)",
  "Spring 2026 (January-May)"
];

function SearchSection() {
  const navigate = useNavigate();
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const [semDropdownOpen, setSemDropdownOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.custom-dropdown')) {
        setUniDropdownOpen(false);
        setSemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = () => {
    navigate('/map', { state: { university: selectedUniversity, semester: selectedSemester } });
  };

  // Capsule style
  const capsuleStyle = (isOpen) => ({
    padding: '10px 20px',
    fontSize: '1rem',
    borderRadius: '999px',
    border: '1px solid #ddd',
    background: isOpen ? '#f0f4ff' : '#fff',
    boxShadow: isOpen ? '0 4px 16px rgba(0, 80, 255, 0.08)' : 'none',
    cursor: 'pointer',
    minWidth: '180px',
    transition: 'background 0.2s, box-shadow 0.2s',
    position: 'relative',
    outline: 'none',
    color: selectedUniversity || selectedSemester ? '#222' : '#888',
    fontWeight: 500,
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  });

  // Dropdown menu style
  const dropdownMenuStyle = (isOpen) => ({
    position: 'absolute',
    top: '110%',
    left: 0,
    width: '100%',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    zIndex: 10,
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
    pointerEvents: isOpen ? 'auto' : 'none',
    transition: 'opacity 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1)',
    marginTop: '6px',
    padding: '6px 0',
  });

  const dropdownItemStyle = (isSelected) => ({
    padding: '10px 24px',
    cursor: 'pointer',
    background: isSelected ? '#e6f0ff' : 'transparent',
    color: isSelected ? '#0050ff' : '#222',
    fontWeight: isSelected ? 600 : 500,
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    transition: 'background 0.18s',
    borderRadius: '8px',
    margin: '2px 8px',
    textAlign: 'left',
  });

  // Helper function to strip months from semester string
  const stripMonths = (semester) => {
    return semester.split(' (')[0];
  };

  return (
    <section className="search-section" style={{ marginTop: '100px' }}>
      <div className="search-container" style={{ textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '40px',
          color: '#333'
        }}>
          University Sublease
        </h1>
        <div className="search-bar" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '15px',
          marginBottom: '50px',
          width: '100%',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          {/* University Dropdown */}
          <div className="custom-dropdown" style={{ position: 'relative', flex: '0 0 auto' }}>
            <button
              type="button"
              className="search-select"
              style={capsuleStyle(uniDropdownOpen)}
              onClick={() => {
                setUniDropdownOpen((open) => !open);
                setSemDropdownOpen(false);
              }}
              tabIndex={0}
            >
              <span>{selectedUniversity || 'Select University'}</span>
              <span style={{ fontSize: '1.1em', color: '#888', marginLeft: '8px' }}>
                ▼
              </span>
            </button>
            <div
              className="dropdown-menu"
              style={dropdownMenuStyle(uniDropdownOpen)}
            >
              {universities.map((uni) => (
                <div
                  key={uni}
                  style={dropdownItemStyle(selectedUniversity === uni)}
                  onClick={() => {
                    setSelectedUniversity(uni);
                    setUniDropdownOpen(false);
                  }}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setSelectedUniversity(uni);
                      setUniDropdownOpen(false);
                    }
                  }}
                >
                  {uni}
                </div>
              ))}
            </div>
          </div>

          {/* Semester Dropdown */}
          <div className="custom-dropdown" style={{ position: 'relative', flex: '0 0 auto' }}>
            <button
              type="button"
              className="search-select"
              style={capsuleStyle(semDropdownOpen)}
              onClick={() => {
                setSemDropdownOpen((open) => !open);
                setUniDropdownOpen(false);
              }}
              tabIndex={0}
            >
              <span>{selectedSemester ? stripMonths(selectedSemester) : 'Select Semester'}</span>
              <span style={{ fontSize: '1.1em', color: '#888', marginLeft: '8px' }}>
                ▼
              </span>
            </button>
            <div
              className="dropdown-menu"
              style={dropdownMenuStyle(semDropdownOpen)}
            >
              {semesters.map((sem) => (
                <div
                  key={sem}
                  style={dropdownItemStyle(selectedSemester === sem)}
                  onClick={() => {
                    setSelectedSemester(sem);
                    setSemDropdownOpen(false);
                  }}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setSelectedSemester(sem);
                      setSemDropdownOpen(false);
                    }
                  }}
                >
                  {sem}
                </div>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="search-button"
            style={{
              padding: '0',
              fontSize: '1.2rem',
              borderRadius: '50%',
              border: '1px solid #ddd',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
              marginLeft: 'auto',
            }}
          >
            <img 
              src={searchPng} 
              alt="Search" 
              style={{ width: '20px', height: '20px' }}
            />
          </button>
        </div>
      </div>
    </section>
  );
}

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>About USublease</h3>
          <p>
            Connecting students with the perfect sublease opportunities across
            Florida universities.
          </p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/map">Find Listings</Link>
            </li>
            <li>
              <Link to="/profile">My Profile</Link>
            </li>
            <li>
              <Link to="/messages">Messages</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>
          <ul>
            <li>Email: support@usublease.com</li>
            <li>Phone: (555) 123-4567</li>
            <li>Address: Tampa, FL</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} USublease. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
//  Main App Component
// ---------------------------------------------------------------------------

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  // Group listings by university for the "featured" section
  const listingsByUniversity = exampleListings.reduce((acc, listing) => {
    if (!acc[listing.university]) acc[listing.university] = [];
    acc[listing.university].push(listing);
    return acc;
  }, {});

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app" style={{ backgroundColor: 'white' }}>
        {/* ---------------------------------------------------------------- */}
        {/*  Header                                                        */}
        {/* ---------------------------------------------------------------- */}
        <header className="header">
          <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={icon} alt="USublease Icon" style={{ width: '38px', height: '38px', objectFit: 'contain', marginRight: '10px' }} />
          </Link>

          <div className="nav-buttons">
            <Link to="/upload" className="nav-button capsule" title="New Listing">
              <span style={{ fontWeight: 'bold' }}>New Listing</span>
            </Link>
            <Link to="/messages" className="nav-button capsule" title="Messages">
              <img src={mailIcon} alt="Messages" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            </Link>
            <Link 
              to={user ? "/profile" : "/login"} 
              className="nav-button capsule" 
              title={user ? "Profile" : "Login"}
            >
              <img src={profileIcon} alt="Profile" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            </Link>
            <Link to="/settings" className="nav-button capsule" title="Settings">
              <img src={settingsIcon} alt="Settings" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            </Link>
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/*  Routes                                                        */}
        {/* ---------------------------------------------------------------- */}
        <Routes>
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/map" element={<Map />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/upload" element={<Upload />} />

          {/* Home – protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <SearchSection />

                  {/* ------------------------------------------------------ */}
                  {/*  Featured Listings                                    */}
                  {/* ------------------------------------------------------ */}
                  <section className="featured-section">
                    {Object.entries(listingsByUniversity).map(
                      ([university, listings]) => (
                        <div key={university} className="university-section">
                          <h2 className="university-title">{university}</h2>

                          <div className="featured-tiles" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '15px',
                            padding: '0 20px'
                          }}>
                            {listings.slice(0, 6).map((listing) => (
                              <div key={listing.id} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}>
                                <div style={{ 
                                  height: '150px',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  transition: 'box-shadow 0.3s ease',
                                  cursor: 'pointer'
                                }}>
                                  <img 
                                    src={listing.image} 
                                    alt={listing.title}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.parentElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.parentElement.style.boxShadow = 'none';
                                    }}
                                  />
                                </div>
                                <div style={{ 
                                  padding: '12px',
                                  background: 'white',
                                  borderRadius: '12px',
                                  transition: 'box-shadow 0.3s ease',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.boxShadow = 'none';
                                }}>
                                  <h3 style={{ 
                                    margin: '0 0 5px 0',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                  }}>{listing.title}</h3>
                                  <p style={{ 
                                    margin: '0 0 3px 0',
                                    fontSize: '0.8rem',
                                    color: '#666'
                                  }}>{listing.price}</p>
                                  <p style={{ 
                                    margin: '0',
                                    fontSize: '0.8rem',
                                    color: '#666'
                                  }}>{listing.semester}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </section>

                  <Footer />
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
