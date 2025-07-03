import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Default listing shown at /listing when no ID is provided
const DEFAULT_LISTING = {
  title: '2 Bedroom across from USF',
  semester: 'Fall',
  year: 2025,
  startDate: '2025-07-10',
  endDate: '2025-07-16',
  university: 'University of South Florida',
  address: '1234 University Dr, Tampa, FL 33612',
  unitType: 'Entire Apt',
  beds: '2',
  baths: '2',
  bedsOffered: '1',
  bathsOffered: '1',
  sharedBath: false,
  monthlyRent: '1200',
  securityDeposit: '100',
  utilities: ['Electric', 'Wi-Fi', 'Water'],
  furnished: false,
  amenities: ['Pool', 'Gym', 'Parking'],
  rules: { pets: false, smoking: false, roommateGender: 'Any' },
  squareFootage: '',
  oneTimeFees: '',
  photos: [
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop'
  ],
  thumbnailIndex: 0,
  lat: 27.592268,
  lon: -81.535898,
  description: 'This place is so fire. Spacious apartment with modern finishes, close to campus and downtown.',
  uploader: { name: 'Jane Bull', contact: 'jane.bull@example.com' }
};

function Listing() {
  const { id } = useParams();
  const location = useLocation();

  // Decide initial listing state
  const initialListing =
    location.state?.listing || (!id ? DEFAULT_LISTING : null);

  const [listing, setListing] = useState(initialListing);
  const [loading, setLoading] = useState(!initialListing && !!id);

  useEffect(() => {
    // If we have an ID but no listing yet, fetch from Firestore
    const fetchListing = async () => {
      if (!listing && id) {
        try {
          const snap = await getDoc(doc(db, 'listings', id));
          if (snap.exists()) {
            setListing({ id: snap.id, ...snap.data() });
          }
        } catch (err) {
          console.error('Failed to fetch listing', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchListing();
  }, [id, listing]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (!listing) return <div style={{ padding: '40px', textAlign: 'center' }}>Listing not found.</div>;

  const {
    title,
    photos = [],
    bedsOffered,
    beds,
    bathsOffered,
    baths,
    monthlyRent,
    securityDeposit,
    description,
    amenities = [],
    utilities = [],
    uploader = null,
    ownerName,
    ownerContact
  } = listing;

  const displayUploader = uploader || (ownerName ? { name: ownerName, contact: ownerContact } : null);

  return (
    <div className="listing-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Title */}
      <h1 style={{ marginBottom: '4px', fontSize: '2rem', color: '#333' }}>{title}</h1>
      {/* University subtitle */}
      {listing.university && (
        <p style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#666' }}>{listing.university}</p>
      )}

      {/* Photos layout */}
      {photos.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}
        >
          {/* Large primary photo */}
          <img
            src={photos[0]}
            alt="photo-main"
            style={{
              flex: '2 1 60%',
              height: '380px',
              minWidth: '260px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />

          {/* Stack of up to 2 smaller photos */}
          {photos.length > 1 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flex: '1 1 220px',
                minWidth: '220px'
              }}
            >
              {photos.slice(1, 3).map((url, idx) => (
                <img
                  key={`stack-${idx}`}
                  src={url}
                  alt={`photo-${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '185px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Beds/Baths & Pricing */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '30px'
        }}
      >
        {/* Beds/Baths */}
        <div
          style={{
            flex: '1 1 260px',
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0' }}>Beds & Baths</h3>
          <p style={{ margin: '6px 0' }}>
            <strong>{bedsOffered || '0'}</strong> {Number(bedsOffered) === 1 ? 'bed' : 'beds'} in a <strong>{beds || '0'}</strong> bedroom
          </p>
          <p style={{ margin: '6px 0' }}>
            <strong>{bathsOffered || '0'}</strong> {Number(bathsOffered) === 1 ? 'bathroom' : 'bathrooms'} in a <strong>{baths || '0'}</strong> bath
          </p>
        </div>

        {/* Pricing */}
        <div
          style={{
            flex: '1 1 260px',
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0' }}>Pricing</h3>
          <p style={{ margin: '6px 0' }}>
            <strong>Rent / month:</strong> ${monthlyRent || '-'}
          </p>
          <p style={{ margin: '6px 0' }}>
            <strong>Security Deposit:</strong> ${securityDeposit || '-'}
          </p>
        </div>
      </div>

      {/* Uploader section */}
      {displayUploader && (
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0' }}>Listed By</h3>
          <p style={{ margin: '6px 0' }}><strong>Name:</strong> {displayUploader.name}</p>
          {displayUploader.contact && (
            <p style={{ margin: '6px 0' }}><strong>Contact:</strong> {displayUploader.contact}</p>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0' }}>Description</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{description}</p>
        </div>
      )}

      {/* Amenities & Utilities */}
      {(amenities.length > 0 || utilities.length > 0) && (
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {amenities.length > 0 && (
            <>
              <h3 style={{ margin: '0 0 12px 0' }}>Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {amenities.map((a, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#f0f4ff',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </>
          )}
          {utilities.length > 0 && (
            <>
              <h3 style={{ margin: '0 0 12px 0' }}>Utilities Included</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {utilities.map((u, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#e8fff0',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {u}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Listing; 