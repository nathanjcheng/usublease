import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { getCurrentUser, fetchAuthSession, signOut } from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';
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
import universityLogos from './data/universityLogos';

// Grid positioning variables
const GRID_PADDING_TOP = 100; // Adjust this value to move the grid up or down
const GRID_VERTICAL_OFFSET = -120; // Changed from -110 to -150 to move grid higher up
const USE_GRAYSCALE = false; // Set to true for grayscale, false for colored logos

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
    <div className="search-section">
      <div className="search-container">
        <h2>Find Your Perfect Sublease</h2>
        <p>Browse thousands of student housing options near your university</p>
        
        <div className="search-filters">
          <div className="filter-group">
            <label>University</label>
            <select 
              value={selectedUniversity} 
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="search-select"
            >
              <option value="">All Universities</option>
              {universities.map((uni) => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Semester</label>
            <select 
              value={selectedSemester} 
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="search-select"
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>{stripMonths(sem)}</option>
              ))}
            </select>
          </div>
          
          <button onClick={handleSearch} className="search-button">
            Search Listings
          </button>
        </div>
      </div>
    </div>
  );
}

function UniversityGrid() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="university-grid-container">
      <h2>Browse by University</h2>
      <div 
        className="university-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {universityLogos.map((logo, index) => (
          <div
            key={index}
            className="university-card"
            style={{
              background: 'white',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
              transform: hoveredIndex === index ? 'translateY(-5px)' : 'translateY(0)',
              boxShadow: hoveredIndex === index ? '0 5px 20px rgba(0,0,0,0.15)' : '0 2px 10px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => window.location.href = `/map?university=${encodeURIComponent(logo.name)}`}
          >
            <img
              src={logo.image}
              alt={logo.name}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                marginBottom: '10px',
                filter: USE_GRAYSCALE ? 'grayscale(100%)' : 'none'
              }}
            />
            <h3 style={{ margin: '0', fontSize: '16px', color: '#333' }}>{logo.name}</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
              {logo.listings} listings
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.log('User not authenticated');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>USublease</h3>
          <p>Connecting students with affordable housing options near their universities.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/map">Browse Listings</a></li>
            <li><a href="/upload">Post a Listing</a></li>
            <li><a href="/profile">My Profile</a></li>
            <li><a href="/messages">Messages</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="/help">Help Center</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Service</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Connect</h4>
          <div className="social-links">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="Instagram">📷</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 USublease. All rights reserved.</p>
      </div>
    </footer>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.log('User not authenticated');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const listener = Hub.listen('auth', ({ payload: { event } }) => {
      switch (event) {
        case 'signIn':
          checkAuth();
          break;
        case 'signOut':
          setUser(null);
          break;
        default:
          break;
      }
    });

    return () => listener();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <img src={icon} alt="USublease" />
              <span>USublease</span>
            </Link>
            
            <div className="nav-menu">
              <Link to="/map" className="nav-link">
                <img src={searchPng} alt="Search" />
                <span>Browse</span>
              </Link>
              
              {user ? (
                <>
                  <Link to="/upload" className="nav-link">
                    <span>Post Listing</span>
                  </Link>
                  <Link to="/messages" className="nav-link">
                    <img src={mailIcon} alt="Messages" />
                    <span>Messages</span>
                  </Link>
                  <Link to="/profile" className="nav-link">
                    <img src={profileIcon} alt="Profile" />
                    <span>Profile</span>
                  </Link>
                  <Link to="/settings" className="nav-link">
                    <img src={settingsIcon} alt="Settings" />
                    <span>Settings</span>
                  </Link>
                  <button 
                    onClick={async () => {
                      try {
                        await signOut();
                        setUser(null);
                      } catch (error) {
                        console.error('Error signing out:', error);
                      }
                    }}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link">
                    <span>Login</span>
                  </Link>
                  <Link to="/signup" className="nav-link">
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <div className="home-page">
                <SearchSection />
                <UniversityGrid />
              </div>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/map" element={<Map />} />
            <Route path="/upload" element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
