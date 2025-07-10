const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body);
    
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};
    
    // Build update expression dynamically
    if (body.notifications !== undefined) {
      updateExpression.push('#notifications = :notifications');
      expressionAttributeNames['#notifications'] = 'notifications';
      expressionAttributeValues[':notifications'] = body.notifications;
    }
    
    if (body.emailNotifications !== undefined) {
      updateExpression.push('#emailNotifications = :emailNotifications');
      expressionAttributeNames['#emailNotifications'] = 'emailNotifications';
      expressionAttributeValues[':emailNotifications'] = body.emailNotifications;
    }
    
    if (body.university !== undefined) {
      updateExpression.push('#university = :university');
      expressionAttributeNames['#university'] = 'university';
      expressionAttributeValues[':university'] = body.university;
    }
    
    if (body.searchRadius !== undefined) {
      updateExpression.push('#searchRadius = :searchRadius');
      expressionAttributeNames['#searchRadius'] = 'searchRadius';
      expressionAttributeValues[':searchRadius'] = body.searchRadius;
    }
    
    if (body.priceRange !== undefined) {
      updateExpression.push('#priceRange = :priceRange');
      expressionAttributeNames['#priceRange'] = 'priceRange';
      expressionAttributeValues[':priceRange'] = body.priceRange;
    }
    
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    const params = {
      TableName: process.env.USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
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