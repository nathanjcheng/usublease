# AWS Backend Setup Guide for USublease

This guide will walk you through setting up the complete AWS backend infrastructure for the USublease application.

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI**: Install and configure AWS CLI
3. **Node.js**: Version 16 or higher
4. **AWS CDK**: Install AWS CDK globally

```bash
npm install -g aws-cdk
```

## Step 1: AWS Account Setup

### 1.1 Create AWS Account
- Go to [AWS Console](https://aws.amazon.com/)
- Create a new account or sign in to existing account
- Set up billing alerts (recommended)

### 1.2 Create IAM User for Development
1. Go to IAM Console
2. Create a new user with programmatic access
3. Attach the following policies:
   - `AdministratorAccess` (for development - restrict in production)
   - Or create custom policies for specific services

### 1.3 Configure AWS CLI
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

## Step 2: AWS Cognito Setup (Authentication)

### 2.1 Create User Pool
1. Go to AWS Cognito Console
2. Click "Create user pool"
3. Configure sign-in experience:
   - **Cognito user pool sign-in options**: Email
   - **User name requirements**: Allow email addresses
   - **Password policy**: Custom (minimum 8 characters)
   - **Multi-factor authentication**: Optional
   - **User account recovery**: Enable self-service account recovery

4. Configure security requirements:
   - **User attributes**: 
     - Email (required)
     - Name (required)
     - Given name (optional)
     - Family name (optional)
   - **Verification**: Email verification required

5. Configure app integration:
   - **App client name**: usublease-web-client
   - **App client secret**: Generate client secret
   - **Callback URLs**: 
     - `http://localhost:3000/`
     - `https://yourdomain.com/`
   - **Sign-out URLs**: 
     - `http://localhost:3000/`
     - `https://yourdomain.com/`

6. Review and create

### 2.2 Note Down Configuration
Save these values for your frontend:
- User Pool ID
- App Client ID
- App Client Secret

## Step 3: DynamoDB Setup (Database)

### 3.1 Create Tables
Create the following DynamoDB tables:

#### Users Table
```bash
aws dynamodb create-table \
    --table-name usublease-users \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

#### Listings Table
```bash
aws dynamodb create-table \
    --table-name usublease-listings \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=university,AttributeType=S \
        AttributeName=createdAt,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=university-index,KeySchema=[{AttributeName=university,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL} \
        IndexName=user-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

#### Messages Table
```bash
aws dynamodb create-table \
    --table-name usublease-messages \
    --attribute-definitions \
        AttributeName=conversationId,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=conversationId,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=user-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

#### Conversations Table
```bash
aws dynamodb create-table \
    --table-name usublease-conversations \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
        AttributeName=updatedAt,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=user-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=updatedAt,KeyType=RANGE}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

## Step 4: S3 Setup (File Storage)

### 4.1 Create S3 Bucket
```bash
aws s3 mb s3://usublease-storage --region us-east-1
```

### 4.2 Configure CORS
Create a CORS configuration file `cors.json`:
```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
            "ExposeHeaders": ["ETag"]
        }
    ]
}
```

Apply CORS:
```bash
aws s3api put-bucket-cors --bucket usublease-storage --cors-configuration file://cors.json
```

### 4.3 Create IAM Policy for S3 Access
Create `s3-policy.json`:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::usublease-storage/*"
        }
    ]
}
```

## Step 5: API Gateway Setup

### 5.1 Create API Gateway
1. Go to API Gateway Console
2. Create new REST API
3. Name: `usublease-api`
4. Description: `USublease Backend API`

### 5.2 Create Resources and Methods
Create the following endpoints:

#### Authentication Endpoints
- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/signout`
- `POST /auth/confirm`
- `POST /auth/forgot-password`

#### User Endpoints
- `GET /user/profile`
- `PUT /user/profile`
- `GET /user/preferences`
- `PUT /user/preferences`

#### Listings Endpoints
- `GET /listings`
- `GET /listings/{id}`
- `POST /listings`
- `PUT /listings/{id}`
- `DELETE /listings/{id}`
- `GET /listings/my-listings`

#### Messages Endpoints
- `GET /messages/conversations`
- `GET /messages/conversations/{id}`
- `POST /messages/conversations`
- `POST /messages/conversations/{id}`

#### Upload Endpoints
- `POST /upload/presigned-url`

#### Search Endpoints
- `POST /search/listings`
- `GET /search/geocode`

### 5.3 Configure CORS
For each endpoint, enable CORS with:
- Access-Control-Allow-Origin: `http://localhost:3000, https://yourdomain.com`
- Access-Control-Allow-Headers: `Content-Type,Authorization`
- Access-Control-Allow-Methods: `GET,POST,PUT,DELETE,OPTIONS`

## Step 6: Lambda Functions Setup

### 6.1 Create Lambda Functions
Create the following Lambda functions:

#### Authentication Functions
- `auth-signup`
- `auth-signin`
- `auth-confirm`
- `auth-forgot-password`

#### User Functions
- `user-get-profile`
- `user-update-profile`
- `user-get-preferences`
- `user-update-preferences`

#### Listings Functions
- `listings-get-all`
- `listings-get-by-id`
- `listings-create`
- `listings-update`
- `listings-delete`
- `listings-get-user-listings`

#### Messages Functions
- `messages-get-conversations`
- `messages-get-messages`
- `messages-create-conversation`
- `messages-send-message`

#### Upload Functions
- `upload-get-presigned-url`

#### Search Functions
- `search-listings`
- `search-geocode`

### 6.2 Lambda Function Example
Here's an example Lambda function for getting user profile:

```javascript
// user-get-profile.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        // Get user ID from JWT token
        const userId = event.requestContext.authorizer.claims.sub;
        
        const params = {
            TableName: 'usublease-users',
            Key: {
                id: userId
            }
        };
        
        const result = await dynamodb.get(params).promise();
        
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({ message: 'User not found' })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
```

## Step 7: Environment Variables Setup

### 7.1 Frontend Environment Variables
Create `.env` file in your frontend directory:

```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-app-client-id
REACT_APP_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod
REACT_APP_S3_BUCKET=usublease-storage
REACT_APP_COOKIE_DOMAIN=localhost
```

### 7.2 Backend Environment Variables
Set environment variables for each Lambda function:

```bash
aws lambda update-function-configuration \
    --function-name user-get-profile \
    --environment Variables='{TABLE_NAME=usublease-users,REGION=us-east-1}' \
    --region us-east-1
```

## Step 8: IAM Roles and Policies

### 8.1 Create Lambda Execution Role
```bash
aws iam create-role \
    --role-name usublease-lambda-execution \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'
```

### 8.2 Attach Policies
```bash
# Basic Lambda execution
aws iam attach-role-policy \
    --role-name usublease-lambda-execution \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# DynamoDB access
aws iam attach-role-policy \
    --role-name usublease-lambda-execution \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# S3 access
aws iam attach-role-policy \
    --role-name usublease-lambda-execution \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Cognito access
aws iam attach-role-policy \
    --role-name usublease-lambda-execution \
    --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser
```

## Step 9: Deploy and Test

### 9.1 Deploy API Gateway
1. Go to API Gateway Console
2. Select your API
3. Click "Actions" → "Deploy API"
4. Choose stage: `prod`
5. Note the invoke URL

### 9.2 Test Endpoints
Use tools like Postman or curl to test your endpoints:

```bash
# Test user profile endpoint
curl -X GET \
  https://your-api-gateway-url.amazonaws.com/prod/user/profile \
  -H 'Authorization: Bearer your-jwt-token'
```

## Step 10: Monitoring and Logging

### 10.1 CloudWatch Logs
All Lambda functions automatically log to CloudWatch. Monitor:
- Function execution times
- Error rates
- Memory usage

### 10.2 CloudWatch Metrics
Set up alarms for:
- API Gateway 4xx/5xx errors
- Lambda function errors
- DynamoDB throttling
- S3 access patterns

## Step 11: Security Best Practices

### 11.1 API Gateway Security
- Use API keys for rate limiting
- Implement request validation
- Use WAF for DDoS protection

### 11.2 Lambda Security
- Use least privilege IAM roles
- Encrypt environment variables
- Use VPC for sensitive functions

### 11.3 DynamoDB Security
- Enable encryption at rest
- Use IAM roles for access
- Implement fine-grained access control

### 11.4 S3 Security
- Enable bucket encryption
- Use bucket policies
- Enable access logging

## Step 12: Cost Optimization

### 12.1 Lambda Optimization
- Use appropriate memory allocation
- Implement connection pooling
- Use provisioned concurrency for high-traffic functions

### 12.2 DynamoDB Optimization
- Use on-demand billing for development
- Implement efficient query patterns
- Use DAX for read-heavy workloads

### 12.3 S3 Optimization
- Use lifecycle policies
- Implement intelligent tiering
- Use CloudFront for static assets

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS is properly configured in API Gateway
2. **Authentication Errors**: Verify Cognito configuration and JWT tokens
3. **DynamoDB Errors**: Check IAM permissions and table names
4. **S3 Upload Errors**: Verify bucket permissions and CORS settings

### Debugging Tools

1. **CloudWatch Logs**: Check Lambda function logs
2. **API Gateway Logs**: Enable detailed logging
3. **X-Ray**: Enable tracing for distributed tracing
4. **CloudTrail**: Monitor API calls and changes

## Next Steps

1. **Production Deployment**: Set up CI/CD pipeline
2. **Monitoring**: Implement comprehensive monitoring
3. **Backup Strategy**: Set up automated backups
4. **Disaster Recovery**: Plan for disaster recovery
5. **Scaling**: Implement auto-scaling strategies

## Support

For AWS-specific issues:
- AWS Documentation: https://docs.aws.amazon.com/
- AWS Support: https://aws.amazon.com/support/
- AWS Forums: https://forums.aws.amazon.com/

For application-specific issues:
- Check the application logs
- Review the code documentation
- Contact the development team 