const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
  try {
    // Get user ID from Cognito token
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body);
    
    // Update user in DynamoDB
    const params = {
      TableName: process.env.USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET #name = :name, email = :email, phone = :phone, university = :university, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': body.name,
        ':email': body.email,
        ':phone': body.phone || null,
        ':university': body.university || null,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    // Update Cognito user attributes if needed
    if (body.email) {
      const cognitoParams = {
        UserPoolId: process.env.USER_POOL_ID,
        Username: userId,
        UserAttributes: [
          {
            Name: 'email',
            Value: body.email
          },
          {
            Name: 'name',
            Value: body.name
          }
        ]
      };
      
      await cognito.adminUpdateUserAttributes(cognitoParams).promise();
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