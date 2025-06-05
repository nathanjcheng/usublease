import React from 'react';

function Messages() {
  return (
    <div className="page-container">
      <h1>Messages</h1>
      <div className="messages-container">
        <div className="message-list">
          <div className="message-item">
            <div className="message-avatar">👤</div>
            <div className="message-content">
              <h3>John Doe</h3>
              <p>Hey, is the apartment still available?</p>
              <span className="message-time">2:30 PM</span>
            </div>
          </div>
          <div className="message-item">
            <div className="message-avatar">👤</div>
            <div className="message-content">
              <h3>Jane Smith</h3>
              <p>I'm interested in the studio apartment</p>
              <span className="message-time">1:45 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages; 