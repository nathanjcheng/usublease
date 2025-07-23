import React, { useState, useEffect } from 'react';
import { listingsAPI } from '../services/api';
import './Map.css';

function Map() {
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Remove filters state

  // Load listings on component mount
  useEffect(() => {
    loadListings();
  }, []); // Remove filters dependency

  const loadListings = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching all listings from all universities...');
      const data = await listingsAPI.getListings();
      console.log('Listings response:', data);
      
      let listings = data.listings || data || [];
      console.log('Processed listings:', listings);
      
      // Always sort by most recent
      listings = listings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setListings(listings);
    } catch (error) {
      console.error('Error loading listings:', error);
      setError(`Failed to load listings: ${error.message || 'Network error'}`);
      setListings([]); // Clear any existing listings on error
    } finally {
      setLoading(false);
    }
  };

  // Remove handleFilterChange and clearFilters functions

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
        
        {/* Remove filters section */}
        
        <div className="listings-grid">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`listing-card ${selectedListing?.id === listing.id ? 'selected' : ''}`}
              onClick={() => setSelectedListing(listing)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            >
              {listing.image && (
                <div className="listing-image">
                  <img src={listing.image} alt={listing.title} />
                </div>
              )}
              <div className="listing-content" style={{ flex: 1 }}>
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
            <p>No listings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Map; 