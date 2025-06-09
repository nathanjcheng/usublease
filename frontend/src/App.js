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
  },

  // UF Listings
  {
    id: 13,
    title: "1BR Apartment - UF Area",
    price: "$800/month",
    semester: "Fall 2024",
    university: "University of Florida",
    address: "1234 University Ave, Gainesville, FL 32603",
    description: "Modern 1-bedroom apartment near UF campus. Recently renovated with new appliances.",
    amenities: ["Furnished", "W/D in unit", "Pool access"],
    coordinates: { lat: 29.6516, lng: -82.3248 },
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop"
  },
  {
    id: 14,
    title: "2BR House - UF East",
    price: "$1000/month",
    semester: "Fall 2024",
    university: "University of Florida",
    address: "5678 SW 13th St, Gainesville, FL 32608",
    description: "Spacious 2-bedroom house in a quiet neighborhood. Close to UF and shopping centers.",
    amenities: ["Furnished", "Backyard", "Parking included"],
    coordinates: { lat: 29.6536, lng: -82.3248 },
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop"
  },
  {
    id: 15,
    title: "3BR Apartment - UF North",
    price: "$1500/month",
    semester: "Fall 2024",
    university: "University of Florida",
    address: "9012 NW 13th St, Gainesville, FL 32601",
    description: "Large 3-bedroom apartment perfect for roommates. Modern amenities and great location.",
    amenities: ["Furnished", "Gym access", "W/D in unit"],
    coordinates: { lat: 29.6556, lng: -82.3248 },
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop"
  },
  {
    id: 16,
    title: "4BR House - UF South",
    price: "$1800/month",
    semester: "Fall 2024",
    university: "University of Florida",
    address: "3456 SW 34th St, Gainesville, FL 32608",
    description: "Large 4-bedroom house perfect for a group of students. Close to campus and amenities.",
    amenities: ["Furnished", "Large backyard", "2-car garage"],
    coordinates: { lat: 29.6576, lng: -82.3248 },
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop"
  },
  {
    id: 17,
    title: "Studio Loft - UF Central",
    price: "$700/month",
    semester: "Fall 2024",
    university: "University of Florida",
    address: "7890 University Ave, Gainesville, FL 32603",
    description: "Modern studio loft with high ceilings. Perfect for single students.",
    amenities: ["Furnished", "High ceilings", "Bike storage"],
    coordinates: { lat: 29.6596, lng: -82.3248 },
    image: "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=500&h=300&fit=crop"
  },
  {
    id: 18,
    title: "Luxury 2BR - UF West",
    price: "$1200/month",
    semester: "Fall 2024",
    university: "University of Florida",
    address: "1234 NW 16th Ave, Gainesville, FL 32603",
    description: "Luxury 2-bedroom apartment with modern amenities. Close to campus.",
    amenities: ["Furnished", "Pool", "Gym access"],
    coordinates: { lat: 29.6616, lng: -82.3248 },
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop"
  }
];

const universities = [
  "University of South Florida",
  "University of Florida",
  "Florida State University",
  "University of Central Florida",
  "Florida International University",
  "University of Miami",
  "Florida Atlantic University",
  "Florida A&M University",
  "University of North Florida",
  "Florida Gulf Coast University",
  "University of West Florida",
  "Florida Polytechnic University",
  "New College of Florida",
  "Florida Southern College",
  "Stetson University"
];

const semesters = [
  "Fall 2024",
  "Spring 2025",
  "Summer 2025",
  "Fall 2025",
  "Spring 2026"
];

function SearchSection() {
  const navigate = useNavigate();
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const handleSearch = () => {
    navigate('/map', { state: { university: selectedUniversity, semester: selectedSemester } });
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
          gap: '10px',
          marginBottom: '50px'
        }}>
          <select
            onChange={(e) => setSelectedUniversity(e.target.value)}
            className="search-select"
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Select University</option>
            {universities.map((uni) => (
              <option key={uni} value={uni}>
                {uni}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="search-select"
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Select Semester</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="search-button"
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          >
            🔍
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
          <Link to="/" className="logo">
            🏠 USublease
          </Link>

          <div className="nav-buttons">
            <Link to="/upload" className="nav-button capsule" title="New Listing">
              New Listing
            </Link>
            <Link to="/messages" className="nav-button" title="Messages">
              💬
            </Link>
            <Link 
              to={user ? "/profile" : "/login"} 
              className="nav-button" 
              title={user ? "Profile" : "Login"}
            >
              👤
            </Link>
            <Link to="/settings" className="nav-button" title="Settings">
              ⚙️
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
