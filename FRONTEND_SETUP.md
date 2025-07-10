# Frontend Setup Guide - AWS Migration

This guide will help you set up the frontend application with AWS backend services.

## Prerequisites

1. **Node.js**: Version 16 or higher
2. **npm** or **yarn**: Package manager
3. **AWS Account**: Configured with the backend services (see AWS_SETUP.md)

## Step 1: Install Dependencies

Navigate to the frontend directory and install the required packages:

```bash
cd frontend
npm install
```

The key dependencies that were added for AWS integration:
- `aws-amplify`: AWS Amplify library for authentication and API calls
- `aws-sdk`: AWS SDK for JavaScript

## Step 2: Environment Configuration

### 2.1 Create Environment File
Copy the example environment file and configure it with your AWS settings:

```bash
cp env.example .env
```

### 2.2 Configure Environment Variables
Edit the `.env` file with your AWS configuration:

```env
# AWS Configuration
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your-user-pool-id-here
REACT_APP_USER_POOL_CLIENT_ID=your-app-client-id-here
REACT_APP_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod
REACT_APP_S3_BUCKET=usublease-storage
REACT_APP_COOKIE_DOMAIN=localhost

# Optional: For development with emulators
REACT_APP_USE_EMULATOR=false
```

**Important**: Replace the placeholder values with your actual AWS configuration from the backend setup.

## Step 3: AWS Configuration Files

### 3.1 AWS Config File
The `src/aws-config.js` file is already configured with the basic AWS Amplify setup. This file:
- Configures Cognito authentication
- Sets up API endpoints
- Configures S3 storage

### 3.2 API Service File
The `src/services/api.js` file contains all the API calls to your AWS backend. This includes:
- User management functions
- Listings CRUD operations
- Messaging functionality
- File upload handling
- Search functionality

## Step 4: Component Updates

The following components have been updated to use AWS services:

### 4.1 Authentication Components
- **Login.js**: Now uses AWS Cognito for authentication
- **Signup.js**: Includes email confirmation flow
- **Profile.js**: Uses AWS API for user data management

### 4.2 Data Components
- **Map.js**: Fetches listings from AWS API
- **Messages.js**: Uses AWS API for messaging
- **Upload.js**: Handles file uploads to S3

### 4.3 Main App Component
- **App.js**: Updated to use AWS authentication state management

## Step 5: Start the Development Server

```bash
npm start
```

The application will start on `http://localhost:3000`

## Step 6: Testing the Application

### 6.1 Test Authentication
1. Navigate to `/signup` to create a new account
2. Check your email for the confirmation code
3. Confirm your account
4. Try logging in at `/login`

### 6.2 Test Features
1. **Browse Listings**: Go to `/map` to see listings
2. **Create Listing**: Go to `/upload` (requires authentication)
3. **View Profile**: Go to `/profile` (requires authentication)
4. **Messages**: Go to `/messages` (requires authentication)

## Step 7: Troubleshooting

### 7.1 Common Issues

#### Authentication Errors
- **"User not found"**: Check if the user pool ID is correct
- **"Invalid credentials"**: Verify the app client ID
- **CORS errors**: Ensure your Cognito app client has the correct callback URLs

#### API Errors
- **"API call failed"**: Check if the API Gateway URL is correct
- **"Unauthorized"**: Verify JWT token is being sent correctly
- **"Not found"**: Ensure the API endpoints are deployed

#### File Upload Errors
- **"Access denied"**: Check S3 bucket permissions
- **"CORS error"**: Verify S3 CORS configuration

### 7.2 Debug Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Monitor API calls and responses
3. **Check Environment Variables**: Ensure all AWS config values are set
4. **Check AWS Console**: Verify services are properly configured

### 7.3 Environment Variable Debugging

Add this to your component to debug environment variables:

```javascript
console.log('AWS Config:', {
  region: process.env.REACT_APP_AWS_REGION,
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  apiEndpoint: process.env.REACT_APP_API_ENDPOINT,
  s3Bucket: process.env.REACT_APP_S3_BUCKET
});
```

## Step 8: Production Deployment

### 8.1 Build the Application

```bash
npm run build
```

### 8.2 Deploy to AWS S3 + CloudFront

1. **Create S3 Bucket for Hosting**:
```bash
aws s3 mb s3://usublease-frontend --region us-east-1
```

2. **Configure S3 for Static Website Hosting**:
```bash
aws s3 website s3://usublease-frontend --index-document index.html --error-document index.html
```

3. **Upload Build Files**:
```bash
aws s3 sync build/ s3://usublease-frontend
```

4. **Set Bucket Policy** (for public read access):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::usublease-frontend/*"
        }
    ]
}
```

### 8.3 Update Environment Variables for Production

Update your `.env` file for production:

```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-app-client-id
REACT_APP_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod
REACT_APP_S3_BUCKET=usublease-storage
REACT_APP_COOKIE_DOMAIN=yourdomain.com
```

## Step 9: Security Considerations

### 9.1 Environment Variables
- Never commit `.env` files to version control
- Use different environment variables for development and production
- Consider using AWS Systems Manager Parameter Store for production secrets

### 9.2 CORS Configuration
- Ensure your API Gateway CORS settings include your production domain
- Update Cognito callback URLs for production

### 9.3 HTTPS
- Always use HTTPS in production
- Configure CloudFront with SSL certificate
- Update all URLs to use HTTPS

## Step 10: Monitoring and Analytics

### 10.1 Error Tracking
Consider adding error tracking services:
- Sentry
- LogRocket
- AWS X-Ray

### 10.2 Analytics
Add analytics to track user behavior:
- Google Analytics
- AWS Pinpoint
- Mixpanel

## Next Steps

1. **Set up CI/CD**: Automate deployment process
2. **Add Testing**: Implement unit and integration tests
3. **Performance Optimization**: Implement code splitting and lazy loading
4. **SEO Optimization**: Add meta tags and structured data
5. **Accessibility**: Ensure WCAG compliance

## Support

For frontend-specific issues:
- Check the browser console for errors
- Review the React documentation
- Check AWS Amplify documentation

For AWS integration issues:
- Review the AWS_SETUP.md guide
- Check AWS CloudWatch logs
- Verify IAM permissions 