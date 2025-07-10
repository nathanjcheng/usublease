const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event, null, 2));
    console.log('Environment variables:', {
      USER_POOL_ID: process.env.USER_POOL_ID,
      USERS_TABLE: process.env.USERS_TABLE
    });
    
    // Check if body exists and is not empty
    if (!event.body) {
      console.error('No request body provided');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ 
          message: 'Request body is required' 
        })
      };
    }
    
    console.log('Raw body:', event.body);
    console.log('Body type:', typeof event.body);
    
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse body:', event.body);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ 
          message: 'Invalid JSON in request body',
          error: parseError.message
        })
      };
    }
    
    const { email, password, name, givenName, familyName } = body;
    
    console.log('Request body:', { email, password, name, givenName, familyName });
    
    // Validate required fields
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ 
          message: 'Email, password, and name are required' 
        })
      };
    }
    
    // Validate password strength
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ 
          message: 'Password must be at least 8 characters long' 
        })
      };
    }
    
    // Create user in Cognito
    const cognitoParams = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'name',
          Value: name
        },
        {
          Name: 'email_verified',
          Value: 'false'
        }
      ]
    };
    
    // Add optional attributes if provided
    if (givenName) {
      cognitoParams.UserAttributes.push({
        Name: 'given_name',
        Value: givenName
      });
    }
    
    if (familyName) {
      cognitoParams.UserAttributes.push({
        Name: 'family_name',
        Value: familyName
      });
    }
    
    const cognitoResult = await cognito.adminCreateUser(cognitoParams).promise();
    const userId = cognitoResult.User.Username;
    
    // Create user record in DynamoDB
    const userRecord = {
      id: userId,
      email: email,
      name: name,
      givenName: givenName || null,
      familyName: familyName || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmailVerified: false
    };
    
    const dynamoParams = {
      TableName: process.env.USERS_TABLE,
      Item: userRecord
    };
    
    await dynamodb.put(dynamoParams).promise();
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'User created successfully. Please check your email for verification.',
        userId: userId,
        email: email,
        name: name,
        requiresConfirmation: true
      })
    };
    
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    let statusCode = 500;
    let message = 'Internal server error';
    
    // Handle specific Cognito errors
    switch (error.code) {
      case 'UsernameExistsException':
        statusCode = 409;
        message = 'An account with this email already exists';
        break;
      case 'InvalidPasswordException':
        statusCode = 400;
        message = 'Password does not meet requirements';
        break;
      case 'InvalidParameterException':
        statusCode = 400;
        message = 'Invalid email format or other parameter';
        break;
      case 'TooManyRequestsException':
        statusCode = 429;
        message = 'Too many requests. Please try again later';
        break;
    }
    
    return {
      statusCode: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({ message: message })
    };
  }
}; 