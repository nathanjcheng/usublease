import React, { useState, useEffect } from 'react';
import { listingsAPI } from '../services/api';
import './Map.css';

function Map() {
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    university: '',
    semester: '',
    minPrice: '',
    maxPrice: '',
    beds: ''
  });

  // Load listings on component mount
  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await listingsAPI.getListings(filters);
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error loading listings:', error);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      university: '',
      semester: '',
      minPrice: '',
      maxPrice: '',
      beds: ''
    });
  };

  // Fallback data for development/testing
  const fallbackListings = [
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

  // Use fallback data if no listings loaded
  const displayListings = listings.length > 0 ? listings : fallbackListings;

  return (
    <div className="map-page">
      <div className="map-container">
        <iframe
          title="USF Area Map"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3523.9925392217137!2d-82.4164!3d28.0587!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88c2b782b3b6d0e1%3A0x5a2c2b2b2b2b2b2b!2sUniversity%20of%20South%20Florida!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
          allowFullScreen
        />
      </div>
      <div className="listings-container">
        <div className="listings-header">
          <h2>Available Listings</h2>
          {loading && <span style={{fontSize: '12px', color: '#666'}}>Loading...</span>}
        </div>
        
        {error && <div className="error-message" style={{color: 'red', padding: '10px'}}>{error}</div>}
        
        {/* Filters */}
        <div className="filters-section" style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
          <h4 style={{margin: '0 0 10px 0'}}>Filters</h4>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
            <select 
              value={filters.university} 
              onChange={(e) => handleFilterChange('university', e.target.value)}
              style={{padding: '5px', borderRadius: '4px'}}
            >
              <option value="">All Universities</option>
              <option value="University of South Florida">USF</option>
              <option value="University of Central Florida">UCF</option>
              <option value="University of Florida">UF</option>
            </select>
            
            <select 
              value={filters.semester} 
              onChange={(e) => handleFilterChange('semester', e.target.value)}
              style={{padding: '5px', borderRadius: '4px'}}
            >
              <option value="">All Semesters</option>
              <option value="Fall 2025">Fall 2025</option>
              <option value="Spring 2026">Spring 2026</option>
              <option value="Summer 2025">Summer 2025</option>
            </select>
            
            <input 
              type="number" 
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              style={{padding: '5px', borderRadius: '4px', width: '100px'}}
            />
            
            <input 
              type="number" 
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              style={{padding: '5px', borderRadius: '4px', width: '100px'}}
            />
            
            <select 
              value={filters.beds} 
              onChange={(e) => handleFilterChange('beds', e.target.value)}
              style={{padding: '5px', borderRadius: '4px'}}
            >
              <option value="">Any Beds</option>
              <option value="1">1 Bed</option>
              <option value="2">2 Beds</option>
              <option value="3">3+ Beds</option>
            </select>
            
            <button 
              onClick={clearFilters}
              style={{padding: '5px 10px', borderRadius: '4px', backgroundColor: '#ddd', border: 'none', cursor: 'pointer'}}
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="listings-grid">
          {displayListings.map((listing) => (
            <div
              key={listing.id}
              className={`listing-card ${selectedListing?.id === listing.id ? 'selected' : ''}`}
              onClick={() => setSelectedListing(listing)}
            >
              <div className="listing-image">
                <img src={listing.image} alt={listing.title} />
              </div>
              <div className="listing-content">
                <h3>{listing.title}</h3>
                <p className="listing-price">${listing.price}/month</p>
                <p className="listing-semester">{listing.semester}</p>
                <p className="listing-address">{listing.address}</p>
                <p className="listing-description">{listing.description}</p>
                <div className="listing-amenities">
                  {listing.amenities.map((amenity, index) => (
                    <span key={index} className="amenity-tag">{amenity}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {displayListings.length === 0 && !loading && (
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
            <p>No listings found matching your criteria.</p>
            <button onClick={clearFilters} style={{padding: '10px 20px', borderRadius: '4px', backgroundColor: '#793094', color: 'white', border: 'none', cursor: 'pointer'}}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Map; 