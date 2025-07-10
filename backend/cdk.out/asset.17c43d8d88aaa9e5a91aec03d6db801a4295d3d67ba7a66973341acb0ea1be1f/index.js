const AWS = require('aws-sdk');

exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const { query } = queryParams;
    
    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        body: JSON.stringify({ message: 'query parameter is required' })
      };
    }
    
    // For now, return mock data
    // In production, you would integrate with a geocoding service like Google Maps API
    const mockResults = [
      {
        place_id: '1',
        description: `${query}, University Campus`,
        structured_formatting: {
          main_text: query,
          secondary_text: 'University Campus'
        },
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      {
        place_id: '2',
        description: `${query} Student Housing`,
        structured_formatting: {
          main_text: query,
          secondary_text: 'Student Housing'
        },
        geometry: {
          location: {
            lat: 40.7589,
            lng: -73.9851
          }
        }
      }
    ];
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify({
        predictions: mockResults
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 