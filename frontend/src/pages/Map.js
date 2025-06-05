import React, { useState } from 'react';
import './Map.css';

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
  },
  {
    id: 4,
    title: "3BR House - USF North",
    price: 1500,
    semester: "Fall 2025",
    address: "3456 42nd St, Tampa, FL 33613",
    description: "Spacious 3 bedroom house with backyard, perfect for students. Close to USF campus.",
    amenities: ["Backyard", "Garage", "Washer/Dryer", "Pet Friendly"],
    coordinates: { lat: 28.0647, lng: -82.4179 },
    image: "https://placehold.co/400x300/e2e8f0/1a202c?text=3BR"
  },
  {
    id: 5,
    title: "Studio Loft - USF East",
    price: 800,
    semester: "Spring 2026",
    address: "7890 56th St, Tampa, FL 33617",
    description: "Modern studio loft with high ceilings and great natural light. Walking distance to campus.",
    amenities: ["Furnished", "High Ceilings", "Parking", "Wifi"],
    coordinates: { lat: 28.0567, lng: -82.4099 },
    image: "https://placehold.co/400x300/e2e8f0/1a202c?text=Loft"
  },
  {
    id: 6,
    title: "4BR House - USF South",
    price: 1800,
    semester: "Fall 2025",
    address: "2345 30th St, Tampa, FL 33612",
    description: "Large 4 bedroom house perfect for a group of students. Close to USF and shopping.",
    amenities: ["Backyard", "Garage", "Washer/Dryer", "Pet Friendly"],
    coordinates: { lat: 28.0547, lng: -82.4159 },
    image: "https://placehold.co/400x300/e2e8f0/1a202c?text=4BR"
  }
];

function Map() {
  const [selectedListing, setSelectedListing] = useState(null);

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
        <h2>Available Listings</h2>
        <div className="listings-grid">
          {exampleListings.map((listing) => (
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
      </div>
    </div>
  );
}

export default Map; 