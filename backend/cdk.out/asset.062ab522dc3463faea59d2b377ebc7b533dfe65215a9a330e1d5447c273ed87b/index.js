const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ 
          message: 'Email and password are required' 
        })
      };
    }
    
    // Initiate authentication
    const authParams = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.APP_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    };
    
    const result = await cognito.initiateAuth(authParams).promise();
    
    if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          challengeName: 'NEW_PASSWORD_REQUIRED',
          session: result.Session,
          message: 'New password required'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        accessToken: result.AuthenticationResult.AccessToken,
        idToken: result.AuthenticationResult.IdToken,
        refreshToken: result.AuthenticationResult.RefreshToken,
        expiresIn: result.AuthenticationResult.ExpiresIn,
        tokenType: result.AuthenticationResult.TokenType
      })
    };
    
  } catch (error) {
    console.error('Error signing in:', error);
    
    let statusCode = 500;
    let message = 'Internal server error';
    
    switch (error.code) {
      case 'UserNotFoundException':
        statusCode = 401;
        message = 'No account found with that email';
        break;
      case 'NotAuthorizedException':
        statusCode = 401;
        message = 'Incorrect password';
        break;
      case 'UserNotConfirmedException':
        statusCode = 401;
        message = 'Please confirm your email address before logging in';
        break;
      case 'TooManyRequestsException':
        statusCode = 429;
        message = 'Too many failed attempts. Please wait and try again later';
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