import React from 'react';

function Profile() {
  return (
    <div className="page-container">
      <h1>Profile</h1>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">👤</div>
          <h2>John Doe</h2>
          <p>University of South Florida</p>
        </div>
        <div className="profile-details">
          <div className="profile-section">
            <h3>Contact Information</h3>
            <p>Email: john.doe@example.com</p>
            <p>Phone: (555) 123-4567</p>
          </div>
          <div className="profile-section">
            <h3>Preferences</h3>
            <p>Preferred Location: Near Campus</p>
            <p>Budget Range: $800 - $1200</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile; 