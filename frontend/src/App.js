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

  const handleSearch = () => {
    navigate('/map', { state: { university: selectedUniversity, semester: selectedSemester } });
  };

  // Helper function to strip months from semester string
  const stripMonths = (semester) => {
    return semester.split(' (')[0];
  };

  return (
    <section className="search-section" style={{ 
      marginTop: '100px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 400px)',
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '200px',
        background: 'linear-gradient(135deg, rgba(51,51,51,0.05) 0%, rgba(85,85,85,0.05) 100%)',
        transform: 'skewY(-3deg)',
        transformOrigin: 'top left'
      },
      '@media (max-width: 768px)': {
        marginTop: '60px',
        minHeight: 'calc(100vh - 300px)'
      }
    }}>
      <div className="search-container" style={{ 
        textAlign: 'center',
        width: '100%',
        maxWidth: '1200px',
        padding: '0 20px',
        position: 'relative',
        zIndex: 1,
        '@media (max-width: 768px)': {
          padding: '0 15px'
        }
      }}>
        <h1 className="floating-title" style={{ 
          fontSize: '4rem', 
          marginBottom: '40px',
          color: '#333',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #1a1a1a, #333333)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: '500',
          letterSpacing: '-0.02em',
          '@media (max-width: 768px)': {
            fontSize: '2.5rem',
            marginBottom: '30px'
          }
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
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto',
          transition: 'all 0.3s ease-in-out',
          padding: '20px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(10px)',
          '@media (max-width: 768px)': {
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '30px',
            padding: '15px'
          }
        }}>
          {/* University Dropdown */}
          <select
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '999px',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              minWidth: '180px',
              width: '100%',
              outline: 'none',
              color: selectedUniversity ? '#222' : '#888',
              fontWeight: 500,
              '@media (max-width: 768px)': {
                padding: '12px 15px',
                fontSize: '0.9rem'
              }
            }}
          >
            <option value="">Select University</option>
            {universities.map((uni) => (
              <option key={uni} value={uni}>{uni}</option>
            ))}
          </select>

          {/* Semester Dropdown */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '999px',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              minWidth: '180px',
              width: '100%',
              outline: 'none',
              color: selectedSemester ? '#222' : '#888',
              fontWeight: 500,
              '@media (max-width: 768px)': {
                padding: '12px 15px',
                fontSize: '0.9rem'
              }
            }}
          >
            <option value="">Select Semester</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>{stripMonths(sem)}</option>
            ))}
          </select>

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
              '@media (max-width: 768px)': {
                width: '40px',
                height: '40px',
                marginLeft: '0'
              }
            }}
          >
            <img 
              src={searchPng} 
              alt="Search" 
              style={{ 
                width: '20px', 
                height: '20px',
                '@media (max-width: 768px)': {
                  width: '18px',
                  height: '18px'
                }
              }} 
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
    <footer className="footer" style={{
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
      padding: '60px 0 30px',
      borderTop: '1px solid rgba(0,0,0,0.05)',
      '@media (max-width: 768px)': {
        padding: '40px 15px 20px'
      }
    }}>
      <div className="footer-content" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
          gap: '30px',
          textAlign: 'center'
        }
      }}>
        <div className="footer-section">
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '20px',
            color: '#333',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-8px',
              left: '0',
              width: '40px',
              height: '2px',
              background: 'linear-gradient(90deg, #333333, #555555)',
              '@media (max-width: 768px)': {
                left: '50%',
                transform: 'translateX(-50%)'
              }
            }
          }}>About USublease</h3>
          <p style={{
            color: '#666',
            lineHeight: '1.6',
            fontSize: '0.95rem'
          }}>
            Connecting students with the perfect sublease opportunities across
            Florida universities.
          </p>
        </div>

        <div className="footer-section">
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '20px',
            color: '#333',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-8px',
              left: '0',
              width: '40px',
              height: '2px',
              background: 'linear-gradient(90deg, #333333, #555555)',
              '@media (max-width: 768px)': {
                left: '50%',
                transform: 'translateX(-50%)'
              }
            }
          }}>Quick Links</h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/" style={{
                color: '#666',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#333'
                }
              }}>Home</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/map" style={{
                color: '#666',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#333'
                }
              }}>Find Listings</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/profile" style={{
                color: '#666',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#333'
                }
              }}>My Profile</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/messages" style={{
                color: '#666',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#333'
                }
              }}>Messages</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '20px',
            color: '#333',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-8px',
              left: '0',
              width: '40px',
              height: '2px',
              background: 'linear-gradient(90deg, #333333, #555555)',
              '@media (max-width: 768px)': {
                left: '50%',
                transform: 'translateX(-50%)'
              }
            }
          }}>Contact Us</h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            color: '#666',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}>
            <li>Email: support@usublease.com</li>
            <li>Phone: (555) 123-4567</li>
            <li>Address: Tampa, FL</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom" style={{
        textAlign: 'center',
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        color: '#666',
        fontSize: '0.9rem'
      }}>
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
        <header className="header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px 20px',
          background: 'linear-gradient(to right, #ffffff, #f8f9fa)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          '@media (max-width: 768px)': {
            padding: '10px 15px'
          }
        }}>
          <Link to="/" className="logo" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            textDecoration: 'none',
            '@media (max-width: 768px)': {
              gap: '5px'
            }
          }}>
            <img src={icon} alt="USublease Icon" style={{ 
              width: '38px', 
              height: '38px', 
              objectFit: 'contain', 
              marginRight: '10px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              '@media (max-width: 768px)': {
                width: '32px',
                height: '32px',
                marginRight: '5px'
              }
            }} />
          </Link>

          <div className="nav-buttons" style={{
            display: 'flex',
            gap: '10px',
            '@media (max-width: 768px)': {
              gap: '5px'
            }
          }}>
            <Link to="/upload" className="nav-button capsule new-listing-btn" title="New Listing" style={{
              padding: '8px 16px',
              borderRadius: '20px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid #ddd',
              cursor: 'pointer',
              '@media (max-width: 768px)': {
                padding: '6px 12px',
                fontSize: '0.9rem'
              }
            }}>
              <span style={{ 
                fontWeight: 'bold',
                color: '#333',
                fontSize: '0.95rem'
              }}>New Listing</span>
            </Link>
            <Link to="/messages" className="nav-button capsule" title="Messages" style={{
              '@media (max-width: 768px)': {
                padding: '8px'
              }
            }}>
              <img src={mailIcon} alt="Messages" style={{ 
                width: '24px', 
                height: '24px', 
                objectFit: 'contain',
                '@media (max-width: 768px)': {
                  width: '20px',
                  height: '20px'
                }
              }} />
            </Link>
            <Link 
              to={user ? "/profile" : "/login"} 
              className="nav-button capsule" 
              title={user ? "Profile" : "Login"}
              style={{
                '@media (max-width: 768px)': {
                  padding: '8px'
                }
              }}
            >
              <img src={profileIcon} alt="Profile" style={{ 
                width: '24px', 
                height: '24px', 
                objectFit: 'contain',
                '@media (max-width: 768px)': {
                  width: '20px',
                  height: '20px'
                }
              }} />
            </Link>
            <Link to="/settings" className="nav-button capsule" title="Settings" style={{
              '@media (max-width: 768px)': {
                padding: '8px'
              }
            }}>
              <img src={settingsIcon} alt="Settings" style={{ 
                width: '24px', 
                height: '24px', 
                objectFit: 'contain',
                '@media (max-width: 768px)': {
                  width: '20px',
                  height: '20px'
                }
              }} />
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
                  <section className="featured-section" style={{
                    padding: '40px 0',
                    background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
                    '@media (max-width: 768px)': {
                      padding: '20px 15px'
                    }
                  }}>
                    {Object.entries(listingsByUniversity).map(
                      ([university, listings]) => (
                        <div key={university} className="university-section">
                          <h2 className="university-title" style={{
                            fontSize: '2rem',
                            marginBottom: '30px',
                            color: '#333',
                            textAlign: 'left',
                            position: 'relative',
                            paddingLeft: '20px',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: '-10px',
                              left: '20px',
                              transform: 'none',
                              width: '60px',
                              height: '3px',
                              background: 'linear-gradient(90deg, #333333, #555555)',
                              borderRadius: '3px'
                            },
                            '@media (max-width: 768px)': {
                              fontSize: '1.5rem',
                              marginBottom: '20px',
                              paddingLeft: '15px'
                            }
                          }}>{university}</h2>

                          <div className="featured-tiles" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '20px',
                            padding: '0 20px',
                            maxWidth: '1400px',
                            margin: '0 auto',
                            '@media (max-width: 1200px)': {
                              gridTemplateColumns: 'repeat(4, 1fr)'
                            },
                            '@media (max-width: 992px)': {
                              gridTemplateColumns: 'repeat(3, 1fr)'
                            },
                            '@media (max-width: 768px)': {
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '15px',
                              padding: '0'
                            },
                            '@media (max-width: 480px)': {
                              gridTemplateColumns: '1fr'
                            }
                          }}>
                            {listings.slice(0, 6).map((listing) => (
                              <div key={listing.id} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-5px)'
                                }
                              }}>
                                <div style={{ 
                                  height: '200px',
                                  borderRadius: '16px',
                                  overflow: 'hidden',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                  '@media (max-width: 768px)': {
                                    height: '160px'
                                  }
                                }}>
                                  <img 
                                    src={listing.image} 
                                    alt={listing.title}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      transition: 'transform 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  />
                                </div>
                                <div style={{ 
                                  padding: '20px',
                                  background: 'white',
                                  borderRadius: '16px',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                  '@media (max-width: 768px)': {
                                    padding: '15px'
                                  }
                                }}>
                                  <h3 style={{ 
                                    margin: '0 0 10px 0',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: '#333',
                                    '@media (max-width: 768px)': {
                                      fontSize: '1rem'
                                    }
                                  }}>{listing.title}</h3>
                                  <p style={{ 
                                    margin: '0 0 5px 0',
                                    fontSize: '0.95rem',
                                    color: '#333',
                                    fontWeight: '500',
                                    '@media (max-width: 768px)': {
                                      fontSize: '0.9rem'
                                    }
                                  }}>{listing.price}</p>
                                  <p style={{ 
                                    margin: '0',
                                    fontSize: '0.9rem',
                                    color: '#666',
                                    '@media (max-width: 768px)': {
                                      fontSize: '0.85rem'
                                    }
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

        {/* Add progress bar styles */}
        <style>
          {`
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #f1f1f1;
            }
            ::-webkit-scrollbar-thumb {
              background: #333;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
            .new-listing-btn:hover {
              background: #f5f5f5 !important;
              border-color: #333 !important;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
              opacity: 0.8 !important;
            }
            .scrollable-dropdown::-webkit-scrollbar {
              width: 6px;
            }
            .scrollable-dropdown::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 3px;
            }
            .scrollable-dropdown::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 3px;
            }
            .scrollable-dropdown::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
            @keyframes float {
              0% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-5px);
              }
              100% {
                transform: translateY(0px);
              }
            }
            .floating-title {
              animation: float 8s ease-in-out infinite;
            }
          `}
        </style>
      </div>
    </Router>
  );
}

export default App;
