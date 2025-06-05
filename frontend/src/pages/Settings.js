import React from 'react';

function Settings() {
  return (
    <div className="page-container">
      <h1>Settings</h1>
      <div className="settings-container">
        <div className="settings-section">
          <h3>Account Settings</h3>
          <div className="settings-item">
            <label>Email Notifications</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="settings-item">
            <label>Push Notifications</label>
            <input type="checkbox" defaultChecked />
          </div>
        </div>
        <div className="settings-section">
          <h3>Privacy Settings</h3>
          <div className="settings-item">
            <label>Show Profile to Others</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="settings-item">
            <label>Show Contact Information</label>
            <input type="checkbox" defaultChecked />
          </div>
        </div>
        <div className="settings-section">
          <h3>Preferences</h3>
          <div className="settings-item">
            <label>Default University</label>
            <select defaultValue="usf">
              <option value="usf">University of South Florida</option>
              <option value="uf">University of Florida</option>
              <option value="fsu">Florida State University</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings; 