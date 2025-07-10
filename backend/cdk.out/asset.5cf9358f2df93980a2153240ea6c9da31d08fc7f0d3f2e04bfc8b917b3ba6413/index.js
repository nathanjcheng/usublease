const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const listingId = event.pathParameters.id;
    
    // Check if listing exists and belongs to user
    const getParams = {
      TableName: process.env.LISTINGS_TABLE,
      Key: { id: listingId }
    };
    
    const existingListing = await dynamodb.get(getParams).promise();
    
    if (!existingListing.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'Listing not found' })
      };
    }
    
    if (existingListing.Item.userId !== userId) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'Not authorized to delete this listing' })
      };
    }
    
    // Delete listing
    const deleteParams = {
      TableName: process.env.LISTINGS_TABLE,
      Key: { id: listingId }
    };
    
    await dynamodb.delete(deleteParams).promise();
    
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
      }
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 