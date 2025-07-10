const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, confirmationCode } = body;
    
    if (!email || !confirmationCode) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ 
          message: 'Email and confirmation code are required' 
        })
      };
    }
    
    // Confirm sign up
    const confirmParams = {
      ClientId: process.env.APP_CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode
    };
    
    await cognito.confirmSignUp(confirmParams).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Email confirmed successfully. You can now sign in.'
      })
    };
    
  } catch (error) {
    console.error('Error confirming signup:', error);
    
    let statusCode = 500;
    let message = 'Internal server error';
    
    switch (error.code) {
      case 'CodeMismatchException':
        statusCode = 400;
        message = 'Invalid confirmation code. Please check your email.';
        break;
      case 'ExpiredCodeException':
        statusCode = 400;
        message = 'Confirmation code has expired. Please request a new one.';
        break;
      case 'UserNotFoundException':
        statusCode = 404;
        message = 'User not found';
        break;
      case 'NotAuthorizedException':
        statusCode = 400;
        message = 'User is already confirmed';
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