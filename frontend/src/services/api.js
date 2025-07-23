import { generateClient } from '@aws-amplify/api';
import { fetchAuthSession } from '@aws-amplify/auth';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_ENDPOINT || 'https://1wcbrg6ta8.execute-api.us-east-1.amazonaws.com/prod';

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens.idToken.toString();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to make authenticated API calls
const authenticatedFetch = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: defaultHeaders
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Helper function to make public API calls (no authentication required)
const publicFetch = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('Making API call to:', fullUrl);
  console.log('API_BASE_URL:', API_BASE_URL);

  const response = await fetch(fullUrl, {
    ...options,
    headers: defaultHeaders
  });

  console.log('API response status:', response.status);
  console.log('API response headers:', response.headers);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API error response body:', errorText);
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// User API calls
export const userAPI = {
  // Get current user profile
  getProfile: async () => {
    return authenticatedFetch('/user/profile');
  },

  // Update user profile
  updateProfile: async (userData) => {
    return authenticatedFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // Get user preferences
  getPreferences: async () => {
    return authenticatedFetch('/user/preferences');
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    return authenticatedFetch('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }
};

// Listings API calls
export const listingsAPI = {
  // Get all listings (completely public - no auth required)
  getListings: async (filters = {}) => {
    try {
      // Temporarily use the original endpoint to test
      const endpoint = '/listings';
      console.log('Calling listings API with endpoint:', endpoint);
      return await publicFetch(endpoint);
    } catch (error) {
      console.error('Error in getListings API call:', error);
      throw error;
    }
  },

  // Get all listings with filters (authenticated version for other features)
  getListingsAuth: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return authenticatedFetch(`/listings?${queryParams}`);
  },

  // Get single listing by ID (public)
  getListing: async (id) => {
    return publicFetch(`/public/listings/${id}`);
  },

  // Create new listing (requires auth)
  createListing: async (listingData) => {
    return authenticatedFetch('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData)
    });
  },

  // Update listing (requires auth)
  updateListing: async (id, listingData) => {
    return authenticatedFetch(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(listingData)
    });
  },

  // Delete listing (requires auth)
  deleteListing: async (id) => {
    return authenticatedFetch(`/listings/${id}`, {
      method: 'DELETE'
    });
  },

  // Get user's listings (requires auth)
  getUserListings: async () => {
    return authenticatedFetch('/listings/my-listings');
  }
};

// Messages API calls
export const messagesAPI = {
  // Get all conversations for current user
  getConversations: async () => {
    return authenticatedFetch('/messages/conversations');
  },

  // Get messages for a specific conversation
  getMessages: async (conversationId) => {
    return authenticatedFetch(`/messages/conversations/${conversationId}`);
  },

  // Send a message
  sendMessage: async (conversationId, message) => {
    return authenticatedFetch(`/messages/conversations/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  // Create new conversation
  createConversation: async (listingId, initialMessage) => {
    return authenticatedFetch('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ listingId, message: initialMessage })
    });
  }
};

// File upload API calls
export const uploadAPI = {
  // Get presigned URL for file upload
  getUploadUrl: async (fileName, fileType) => {
    return authenticatedFetch('/upload/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileType })
    });
  },

  // Upload file using presigned URL
  uploadFile: async (presignedUrl, file) => {
    return fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
  }
};

// Search API calls
export const searchAPI = {
  // Search listings
  searchListings: async (searchParams) => {
    return authenticatedFetch('/search/listings', {
      method: 'POST',
      body: JSON.stringify(searchParams)
    });
  },

  // Get address suggestions
  getAddressSuggestions: async (query) => {
    return authenticatedFetch(`/search/geocode?q=${encodeURIComponent(query)}`);
  }
};

export default {
  userAPI,
  listingsAPI,
  messagesAPI,
  uploadAPI,
  searchAPI
}; 