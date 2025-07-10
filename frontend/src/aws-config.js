import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
      mandatorySignIn: true,
      cookieStorage: {
        domain: process.env.REACT_APP_COOKIE_DOMAIN || 'localhost',
        path: '/',
        expires: 365,
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  API: {
    endpoints: [
      {
        name: 'usublease-api',
        endpoint: process.env.REACT_APP_API_ENDPOINT || 'https://your-api-gateway-url.amazonaws.com/prod',
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
      }
    ]
  },
  Storage: {
    AWSS3: {
      bucket: process.env.REACT_APP_S3_BUCKET || 'usublease-storage',
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
    }
  }
};

// Initialize Amplify
Amplify.configure(awsConfig);

export default awsConfig; 