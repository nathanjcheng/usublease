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

  // Use only listings from backend

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
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`listing-card ${selectedListing?.id === listing.id ? 'selected' : ''}`}
              onClick={() => setSelectedListing(listing)}
            >
              {listing.image && (
                <div className="listing-image">
                  <img src={listing.image} alt={listing.title} />
                </div>
              )}
              <div className="listing-content">
                <h3>{listing.title}</h3>
                <p className="listing-price">${listing.price}/month</p>
                <p className="listing-semester">{listing.semester}</p>
                <p className="listing-address">{listing.address}</p>
                <p className="listing-description">{listing.description}</p>
                <div className="listing-amenities">
                  {listing.amenities && listing.amenities.map((amenity, index) => (
                    <span key={index} className="amenity-tag">{amenity}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {listings.length === 0 && !loading && (
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