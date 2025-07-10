const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body);
    
    const listingId = uuidv4();
    const now = new Date().toISOString();
    
    const listing = {
      id: listingId,
      userId: userId,
      title: body.title,
      description: body.description,
      price: body.price,
      university: body.university,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      images: body.images || [],
      amenities: body.amenities || [],
      availableFrom: body.availableFrom,
      availableTo: body.availableTo,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      createdAt: now,
      updatedAt: now
    };
    
    const params = {
      TableName: process.env.LISTINGS_TABLE,
      Item: listing
    };
    
    await dynamodb.put(params).promise();
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify(listing)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 