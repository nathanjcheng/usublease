const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
  try {
    // Get user ID from Cognito token
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body);
    
    // Build dynamic update expression
    let updateExpression = 'SET ';
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    const fields = Object.keys(body);
    fields.forEach((field, idx) => {
      updateExpression += `#${field} = :${field}`;
      if (idx < fields.length - 1) updateExpression += ', ';
      ExpressionAttributeNames[`#${field}`] = field;
      ExpressionAttributeValues[`:${field}`] = body[field];
    });
    // Always update updatedAt
    updateExpression += fields.length ? ', #updatedAt = :updatedAt' : '#updatedAt = :updatedAt';
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: process.env.USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    // Update Cognito user attributes if needed
    if (body.email || body.name) {
      const cognitoParams = {
        UserPoolId: process.env.USER_POOL_ID,
        Username: userId,
        UserAttributes: []
      };
      if (body.email) {
        cognitoParams.UserAttributes.push({ Name: 'email', Value: body.email });
      }
      if (body.name) {
        cognitoParams.UserAttributes.push({ Name: 'name', Value: body.name });
      }
      if (cognitoParams.UserAttributes.length > 0) {
        await cognito.adminUpdateUserAttributes(cognitoParams).promise();
      }
    }
    
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