const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email } = body;
    
    if (!email) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ 
          message: 'Email is required' 
        })
      };
    }
    
    // Forgot password
    const forgotPasswordParams = {
      ClientId: process.env.APP_CLIENT_ID,
      Username: email
    };
    
    await cognito.forgotPassword(forgotPasswordParams).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Password reset code has been sent to your email.'
      })
    };
    
  } catch (error) {
    console.error('Error in forgot password:', error);
    
    let statusCode = 500;
    let message = 'Internal server error';
    
    switch (error.code) {
      case 'UserNotFoundException':
        statusCode = 404;
        message = 'No account found with that email';
        break;
      case 'LimitExceededException':
        statusCode = 429;
        message = 'Too many requests. Please wait and try again later';
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