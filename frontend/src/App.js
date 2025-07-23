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

// Scrolling background component
function ScrollingBackground() {
  return (
    <div className="scrolling-background">
      <div className="scrolling-row">
        {universityLogos.map((logo, index) => (
          <div key={`scroll-${index}`} className="scrolling-logo">
            <img
              src={logo.image}
              alt={logo.name}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                filter: USE_GRAYSCALE ? 'grayscale(100%)' : 'none',
                opacity: 0.3
              }}
            />
          </div>
        ))}
      </div>
      <div className="scrolling-row" aria-hidden="true">
        {universityLogos.map((logo, index) => (
          <div key={`scroll-duplicate-${index}`} className="scrolling-logo">
            <img
              src={logo.image}
              alt={logo.name}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                filter: USE_GRAYSCALE ? 'grayscale(100%)' : 'none',
                opacity: 0.3
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <ScrollingBackground />
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
