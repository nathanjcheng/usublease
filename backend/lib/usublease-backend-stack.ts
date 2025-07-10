import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export class UsubleaseBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool for Authentication
    const userPool = new cognito.UserPool(this, 'UsubleaseUserPool', {
      userPoolName: 'usublease-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change for production
    });

    // Use existing Cognito App Client (created manually in console)
    const appClientId = '60a6ict450vs8so0hqjenjcoid';

    // DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'usublease-users',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    const listingsTable = new dynamodb.Table(this, 'ListingsTable', {
      tableName: 'usublease-listings',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    // Add GSI for listings by university
    listingsTable.addGlobalSecondaryIndex({
      indexName: 'university-index',
      partitionKey: { name: 'university', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for listings by user
    listingsTable.addGlobalSecondaryIndex({
      indexName: 'user-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: 'usublease-messages',
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    const conversationsTable = new dynamodb.Table(this, 'ConversationsTable', {
      tableName: 'usublease-conversations',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    // Add GSI for conversations by user
    conversationsTable.addGlobalSecondaryIndex({
      indexName: 'user-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // S3 Bucket for File Storage
    const storageBucket = new s3.Bucket(this, 'StorageBucket', {
      bucketName: 'usublease-storage',
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
      autoDeleteObjects: true, // For development
    });

    // Add CORS configuration to S3 bucket
    storageBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
      allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag'],
    });

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    usersTable.grantReadWriteData(lambdaRole);
    listingsTable.grantReadWriteData(lambdaRole);
    messagesTable.grantReadWriteData(lambdaRole);
    conversationsTable.grantReadWriteData(lambdaRole);

    // Grant S3 permissions
    storageBucket.grantReadWrite(lambdaRole);

    // Grant Cognito permissions
    userPool.grant(lambdaRole, 'cognito-idp:AdminGetUser', 'cognito-idp:AdminUpdateUserAttributes', 'cognito-idp:AdminCreateUser', 'cognito-idp:InitiateAuth', 'cognito-idp:ConfirmSignUp', 'cognito-idp:ForgotPassword');

    // API Gateway
    const api = new apigateway.RestApi(this, 'UsubleaseApi', {
      restApiName: 'usublease-api',
      description: 'USublease Backend API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // Lambda Functions
    const createLambdaFunction = (name: string, handler: string, environment?: { [key: string]: string }) => {
      return new lambda.Function(this, name, {
        functionName: name,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: handler,
        code: lambda.Code.fromAsset(`lambda/${name}`),
        role: lambdaRole,
        environment: {
          USERS_TABLE: usersTable.tableName,
          LISTINGS_TABLE: listingsTable.tableName,
          MESSAGES_TABLE: messagesTable.tableName,
          CONVERSATIONS_TABLE: conversationsTable.tableName,
          STORAGE_BUCKET: storageBucket.bucketName,
          USER_POOL_ID: userPool.userPoolId,
          APP_CLIENT_ID: appClientId,
          ...environment,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logRetention: logs.RetentionDays.ONE_WEEK,
      });
    };

    // Create Lambda functions
    const authSignupFunction = createLambdaFunction('auth-signup', 'index.handler');
    const authSigninFunction = createLambdaFunction('auth-signin', 'index.handler');
    const authConfirmFunction = createLambdaFunction('auth-confirm', 'index.handler');
    const authForgotPasswordFunction = createLambdaFunction('auth-forgot-password', 'index.handler');
    
    const userGetProfileFunction = createLambdaFunction('user-get-profile', 'index.handler');
    const userUpdateProfileFunction = createLambdaFunction('user-update-profile', 'index.handler');
    const userGetPreferencesFunction = createLambdaFunction('user-get-preferences', 'index.handler');
    const userUpdatePreferencesFunction = createLambdaFunction('user-update-preferences', 'index.handler');
    
    const listingsGetAllFunction = createLambdaFunction('listings-get-all', 'index.handler');
    const listingsCreateFunction = createLambdaFunction('listings-create', 'index.handler');
    const listingsGetByIdFunction = createLambdaFunction('listings-get-by-id', 'index.handler');
    const listingsUpdateFunction = createLambdaFunction('listings-update', 'index.handler');
    const listingsDeleteFunction = createLambdaFunction('listings-delete', 'index.handler');
    
    const messagesGetConversationsFunction = createLambdaFunction('messages-get-conversations', 'index.handler');
    const messagesGetMessagesFunction = createLambdaFunction('messages-get-messages', 'index.handler');
    const messagesSendMessageFunction = createLambdaFunction('messages-send-message', 'index.handler');
    
    const uploadGetPresignedUrlFunction = createLambdaFunction('upload-get-presigned-url', 'index.handler');
    
    const searchListingsFunction = createLambdaFunction('search-listings', 'index.handler');
    const searchGeocodeFunction = createLambdaFunction('search-geocode', 'index.handler');

    // API Gateway Resources and Methods
    
    // Authentication endpoints
    const authResource = api.root.addResource('auth');
    const signupResource = authResource.addResource('signup');
    signupResource.addMethod('POST', new apigateway.LambdaIntegration(authSignupFunction));
    
    const signinResource = authResource.addResource('signin');
    signinResource.addMethod('POST', new apigateway.LambdaIntegration(authSigninFunction));
    
    const confirmResource = authResource.addResource('confirm');
    confirmResource.addMethod('POST', new apigateway.LambdaIntegration(authConfirmFunction));
    
    const forgotPasswordResource = authResource.addResource('forgot-password');
    forgotPasswordResource.addMethod('POST', new apigateway.LambdaIntegration(authForgotPasswordFunction));

    // User endpoints
    const userResource = api.root.addResource('user');
    const profileResource = userResource.addResource('profile');
    profileResource.addMethod('GET', new apigateway.LambdaIntegration(userGetProfileFunction), {
      authorizer: authorizer,
    });
    profileResource.addMethod('PUT', new apigateway.LambdaIntegration(userUpdateProfileFunction), {
      authorizer: authorizer,
    });
    
    const preferencesResource = userResource.addResource('preferences');
    preferencesResource.addMethod('GET', new apigateway.LambdaIntegration(userGetPreferencesFunction), {
      authorizer: authorizer,
    });
    preferencesResource.addMethod('PUT', new apigateway.LambdaIntegration(userUpdatePreferencesFunction), {
      authorizer: authorizer,
    });

    // Listings endpoints
    const listingsResource = api.root.addResource('listings');
    listingsResource.addMethod('GET', new apigateway.LambdaIntegration(listingsGetAllFunction));
    listingsResource.addMethod('POST', new apigateway.LambdaIntegration(listingsCreateFunction), {
      authorizer: authorizer,
    });

    const listingResource = listingsResource.addResource('{id}');
    listingResource.addMethod('GET', new apigateway.LambdaIntegration(listingsGetByIdFunction));
    listingResource.addMethod('PUT', new apigateway.LambdaIntegration(listingsUpdateFunction), {
      authorizer: authorizer,
    });
    listingResource.addMethod('DELETE', new apigateway.LambdaIntegration(listingsDeleteFunction), {
      authorizer: authorizer,
    });

    const myListingsResource = listingsResource.addResource('my-listings');
    myListingsResource.addMethod('GET', new apigateway.LambdaIntegration(listingsGetAllFunction), {
      authorizer: authorizer,
    });

    // Messages endpoints
    const messagesResource = api.root.addResource('messages');
    const conversationsResource = messagesResource.addResource('conversations');
    conversationsResource.addMethod('GET', new apigateway.LambdaIntegration(messagesGetConversationsFunction), {
      authorizer: authorizer,
    });
    conversationsResource.addMethod('POST', new apigateway.LambdaIntegration(messagesSendMessageFunction), {
      authorizer: authorizer,
    });

    const conversationResource = conversationsResource.addResource('{id}');
    conversationResource.addMethod('GET', new apigateway.LambdaIntegration(messagesGetMessagesFunction), {
      authorizer: authorizer,
    });
    conversationResource.addMethod('POST', new apigateway.LambdaIntegration(messagesSendMessageFunction), {
      authorizer: authorizer,
    });

    // Upload endpoints
    const uploadResource = api.root.addResource('upload');
    const presignedUrlResource = uploadResource.addResource('presigned-url');
    presignedUrlResource.addMethod('POST', new apigateway.LambdaIntegration(uploadGetPresignedUrlFunction), {
      authorizer: authorizer,
    });

    // Search endpoints
    const searchResource = api.root.addResource('search');
    const searchListingsResource = searchResource.addResource('listings');
    searchListingsResource.addMethod('POST', new apigateway.LambdaIntegration(searchListingsFunction));
    
    const geocodeResource = searchResource.addResource('geocode');
    geocodeResource.addMethod('GET', new apigateway.LambdaIntegration(searchGeocodeFunction));

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'AppClientId', {
              value: appClientId,
      description: 'Cognito App Client ID',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint',
    });

    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: storageBucket.bucketName,
      description: 'S3 Storage Bucket Name',
    });
  }
} 