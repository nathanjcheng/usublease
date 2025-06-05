import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './App.css';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Map from './pages/Map';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Example listings data
const exampleListings = [
  {
    id: 1,
    title: "Cozy Studio near USF",
    price: 850,
    semester: "Fall 2025",
    address: "1234 University Dr, Tampa, FL 33612",
    description: "Modern studio apartment just 5 minutes from USF campus. Fully furnished with all utilities included.",
    amenities: ["Furnished", "Utilities Included", "Parking", "Wifi"],
    coordinates: { lat: 28.0587, lng: -82.4139 },
    image: "https://placehold.co/400x300/e2e8f0/1a202c?text=Studio"
  },
  {
    id: 2,
    title: "2BR Apartment - USF Area",
    price: 1200,
    semester: "Spring 2026",
    address: "5678 Bruce B Downs Blvd, Tampa, FL 33612",
    description: "Spacious 2 bedroom apartment with modern appliances and great amenities.",
    amenities: ["Washer/Dryer", "Pool", "Gym", "Pet Friendly"],
    coordinates: { lat: 28.0627, lng: -82.4159 },
    image: "https://placehold.co/400x300/e2e8f0/1a202c?text=2BR"
  },
  {
    id: 3,
    title: "Luxury 1BR - USF Village",
    price: 950,
    semester: "Fall 2025",
    address: "9012 Fowler Ave, Tampa, FL 33612",
    description: "Luxury 1 bedroom apartment in the heart of USF Village. Walking distance to campus.",
    amenities: ["Furnished", "Pool", "Gym", "24/7 Security"],
    coordinates: { lat: 28.0607, lng: -82.4119 },
    image: "https://placehold.co/400x300/e2e8f0/1a202c?text=1BR"
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
  "Florida Gulf Coast University"
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
    <section className="search-section">
      <div className="search-container">
        <div className="search-bar">
          <select
            onChange={(e) => setSelectedUniversity(e.target.value)}
            className="search-select"
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
          >
            🔍
          </button>
        </div>
      </div>
    </section>
  );
}

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const auth = getAuth();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <Link to="/" className="logo">🏠 USublease</Link>
          <div className="nav-buttons">
            <Link to="/messages" className="nav-button capsule">Messages</Link>
            <Link to="/profile" className="nav-button capsule">Profile</Link>
            <Link to="/settings" className="nav-button capsule">Settings</Link>
          </div>
        </header>

        <Routes>
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/map" element={<Map />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
              <>
                <SearchSection />
                <section className="featured-section">
                  <h2 className="featured-title">Featured Listings</h2>
                  <div className="featured-tiles">
                    {exampleListings.map((listing) => (
                      <div key={listing.id} className="featured-tile">
                        <div className="tile-image">
                          <img src={listing.image} alt={listing.title} />
                        </div>
                        <div className="tile-content">
                          <h3>{listing.title}</h3>
                          <p className="tile-price">${listing.price}/month</p>
                          <p className="tile-semester">{listing.semester}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;