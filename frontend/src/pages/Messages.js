import React, { useState, useEffect } from 'react';
import { messagesAPI } from '../services/api';
import './Messages.css';

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data.conversations || []);
      
      // Select first conversation if available
      if (data.conversations && data.conversations.length > 0) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    setLoading(true);
    setError('');
    
    try {
      const data = await messagesAPI.getMessages(conversationId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setLoading(true);
    setError('');
    
    try {
      // Send message via API
      await messagesAPI.sendMessage(selectedConversation.id, newMessage);
      
      // Add message to local state
      const messageData = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'You',
        timestamp: new Date().toISOString(),
        conversationId: selectedConversation.id
      };
      
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: newMessage, timestamp: 'Just now' }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  // Fallback data for development/testing
  const fallbackConversations = [
    {
      id: 1,
      name: "John Smith",
      avatar: "https://placehold.co/100x100/e2e8f0/1a202c?text=JS",
      lastMessage: "Is the apartment still available?",
      timestamp: "10:30 AM",
      unread: true
    },
    {
      id: 2,
      name: "Sarah Johnson",
      avatar: "https://placehold.co/100x100/e2e8f0/1a202c?text=SJ",
      lastMessage: "Can I schedule a viewing?",
      timestamp: "Yesterday",
      unread: false
    }
  ];

  const fallbackMessages = [
    { id: 1, sender: "John Smith", text: "Hi, I'm interested in your sublease", timestamp: "10:15 AM" },
    { id: 2, sender: "You", text: "Yes, it's still available! What semester are you looking for?", timestamp: "10:20 AM" },
    { id: 3, sender: "John Smith", text: "Is the apartment still available?", timestamp: "10:30 AM" }
  ];

  // Use fallback data if no conversations loaded
  const displayConversations = conversations.length > 0 ? conversations : fallbackConversations;
  const displayMessages = messages.length > 0 ? messages : fallbackMessages;

  return (
    <div className="messages-page">
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Messages</h2>
          {loading && <span style={{fontSize: '12px', color: '#666'}}>Loading...</span>}
        </div>
        {error && <div className="error-message" style={{color: 'red', padding: '10px'}}>{error}</div>}
        <div className="chat-previews">
          {displayConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`chat-preview ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
              onClick={() => handleConversationSelect(conversation)}
            >
              <img src={conversation.avatar} alt={conversation.name} className="chat-avatar" />
              <div className="chat-info">
                <div className="chat-header">
                  <h3>{conversation.name}</h3>
                  <span className="chat-time">{conversation.timestamp}</span>
                </div>
                <p className={`chat-last-message ${conversation.unread ? 'unread' : ''}`}>
                  {conversation.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="chat-window">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <img src={selectedConversation.avatar} alt={selectedConversation.name} className="chat-avatar" />
              <h3>{selectedConversation.name}</h3>
            </div>
            <div className="chat-messages">
              {displayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender === "You" ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{message.text}</p>
                    <span className="message-time">{message.timestamp}</span>
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
                disabled={loading}
              />
              <button type="submit" disabled={loading || !newMessage.trim()}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-conversation">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages; 