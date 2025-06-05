import React, { useState } from 'react';
import './Messages.css';

const exampleChats = [
  {
    id: 1,
    name: "John Smith",
    avatar: "https://placehold.co/100x100/e2e8f0/1a202c?text=JS",
    lastMessage: "Is the apartment still available?",
    timestamp: "10:30 AM",
    unread: true,
    messages: [
      { sender: "John Smith", text: "Hi, I'm interested in your sublease", time: "10:15 AM" },
      { sender: "You", text: "Yes, it's still available! What semester are you looking for?", time: "10:20 AM" },
      { sender: "John Smith", text: "Is the apartment still available?", time: "10:30 AM" }
    ]
  },
  {
    id: 2,
    name: "Sarah Johnson",
    avatar: "https://placehold.co/100x100/e2e8f0/1a202c?text=SJ",
    lastMessage: "Can I schedule a viewing?",
    timestamp: "Yesterday",
    unread: false,
    messages: [
      { sender: "Sarah Johnson", text: "Hello! I saw your listing for the 2BR apartment", time: "Yesterday, 3:45 PM" },
      { sender: "You", text: "Hi Sarah! Yes, it's a great place near campus", time: "Yesterday, 4:00 PM" },
      { sender: "Sarah Johnson", text: "Can I schedule a viewing?", time: "Yesterday, 4:15 PM" }
    ]
  },
  {
    id: 3,
    name: "Mike Wilson",
    avatar: "https://placehold.co/100x100/e2e8f0/1a202c?text=MW",
    lastMessage: "What's the exact address?",
    timestamp: "Monday",
    unread: false,
    messages: [
      { sender: "Mike Wilson", text: "Hey, I'm interested in the studio", time: "Monday, 11:20 AM" },
      { sender: "You", text: "Great! It's available for Fall 2025", time: "Monday, 11:30 AM" },
      { sender: "Mike Wilson", text: "What's the exact address?", time: "Monday, 11:45 AM" }
    ]
  },
  {
    id: 4,
    name: "Emily Brown",
    avatar: "https://placehold.co/100x100/e2e8f0/1a202c?text=EB",
    lastMessage: "Is parking included?",
    timestamp: "Last week",
    unread: false,
    messages: [
      { sender: "Emily Brown", text: "Hi! I'm looking for a place for Spring 2026", time: "Last week, 2:00 PM" },
      { sender: "You", text: "Perfect! This unit will be available then", time: "Last week, 2:15 PM" },
      { sender: "Emily Brown", text: "Is parking included?", time: "Last week, 2:30 PM" }
    ]
  }
];

function Messages() {
  const [selectedChat, setSelectedChat] = useState(exampleChats[0]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const updatedChat = {
        ...selectedChat,
        messages: [
          ...selectedChat.messages,
          {
            sender: "You",
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        lastMessage: newMessage,
        timestamp: "Just now"
      };
      setSelectedChat(updatedChat);
      setNewMessage('');
    }
  };

  return (
    <div className="messages-page">
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Messages</h2>
        </div>
        <div className="chat-previews">
          {exampleChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-preview ${selectedChat.id === chat.id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
              <div className="chat-info">
                <div className="chat-header">
                  <h3>{chat.name}</h3>
                  <span className="chat-time">{chat.timestamp}</span>
                </div>
                <p className={`chat-last-message ${chat.unread ? 'unread' : ''}`}>
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="chat-window">
        <div className="chat-header">
          <img src={selectedChat.avatar} alt={selectedChat.name} className="chat-avatar" />
          <h3>{selectedChat.name}</h3>
        </div>
        <div className="chat-messages">
          {selectedChat.messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === "You" ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">{message.time}</span>
              </div>
            </div>
          ))}
        </div>
        <form className="message-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default Messages; 