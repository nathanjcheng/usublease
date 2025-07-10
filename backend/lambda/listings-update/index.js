const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const listingId = event.pathParameters.id;
    const body = JSON.parse(event.body);
    
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
          'Access-Control-Allow-Methods': 'PUT,OPTIONS'
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
          'Access-Control-Allow-Methods': 'PUT,OPTIONS'
        },
        body: JSON.stringify({ message: 'Not authorized to update this listing' })
      };
    }
    
    // Update listing
    const updateParams = {
      TableName: process.env.LISTINGS_TABLE,
      Key: { id: listingId },
      UpdateExpression: 'SET title = :title, description = :description, price = :price, university = :university, address = :address, latitude = :latitude, longitude = :longitude, images = :images, amenities = :amenities, availableFrom = :availableFrom, availableTo = :availableTo, contactPhone = :contactPhone, contactEmail = :contactEmail, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':title': body.title,
        ':description': body.description,
        ':price': body.price,
        ':university': body.university,
        ':address': body.address,
        ':latitude': body.latitude,
        ':longitude': body.longitude,
        ':images': body.images || [],
        ':amenities': body.amenities || [],
        ':availableFrom': body.availableFrom,
        ':availableTo': body.availableTo,
        ':contactPhone': body.contactPhone,
        ':contactEmail': body.contactEmail,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(updateParams).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'PUT,OPTIONS'
      },
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'PUT,OPTIONS'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 