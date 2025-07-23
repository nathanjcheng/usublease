"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsubleaseBackendStack = void 0;
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const s3 = require("aws-cdk-lib/aws-s3");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const iam = require("aws-cdk-lib/aws-iam");
const logs = require("aws-cdk-lib/aws-logs");
class UsubleaseBackendStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            removalPolicy: cdk.RemovalPolicy.DESTROY,
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
        const createLambdaFunction = (name, handler, environment) => {
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
exports.UsubleaseBackendStack = UsubleaseBackendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXN1YmxlYXNlLWJhY2tlbmQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c3VibGVhc2UtYmFja2VuZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsbURBQW1EO0FBQ25ELHFEQUFxRDtBQUNyRCx5Q0FBeUM7QUFDekMseURBQXlEO0FBQ3pELGlEQUFpRDtBQUNqRCwyQ0FBMkM7QUFDM0MsNkNBQTZDO0FBRTdDLE1BQWEscUJBQXNCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDbEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix1Q0FBdUM7UUFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMvRCxZQUFZLEVBQUUsaUJBQWlCO1lBQy9CLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsYUFBYSxFQUFFO2dCQUNiLEtBQUssRUFBRSxJQUFJO2FBQ1o7WUFDRCxrQkFBa0IsRUFBRTtnQkFDbEIsS0FBSyxFQUFFO29CQUNMLFFBQVEsRUFBRSxJQUFJO29CQUNkLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxRQUFRLEVBQUUsS0FBSztvQkFDZixPQUFPLEVBQUUsSUFBSTtpQkFDZDtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7YUFDRjtZQUNELGNBQWMsRUFBRTtnQkFDZCxTQUFTLEVBQUUsQ0FBQztnQkFDWixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsY0FBYyxFQUFFLEtBQUs7YUFDdEI7WUFDRCxlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxVQUFVO1lBQ25ELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSwwQ0FBMEM7U0FDckYsQ0FBQyxDQUFDO1FBRUgsZ0VBQWdFO1FBQ2hFLE1BQU0sV0FBVyxHQUFHLDRCQUE0QixDQUFDO1FBRWpELGtCQUFrQjtRQUNsQixNQUFNLFVBQVUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUN4RCxTQUFTLEVBQUUsaUJBQWlCO1lBQzVCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGtCQUFrQjtTQUM3RCxDQUFDLENBQUM7UUFFSCxNQUFNLGFBQWEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUM5RCxTQUFTLEVBQUUsb0JBQW9CO1lBQy9CLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGtCQUFrQjtTQUM3RCxDQUFDLENBQUM7UUFFSCxxQ0FBcUM7UUFDckMsYUFBYSxDQUFDLHVCQUF1QixDQUFDO1lBQ3BDLFNBQVMsRUFBRSxrQkFBa0I7WUFDN0IsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDekUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDbkUsY0FBYyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRztTQUM1QyxDQUFDLENBQUM7UUFFSCwrQkFBK0I7UUFDL0IsYUFBYSxDQUFDLHVCQUF1QixDQUFDO1lBQ3BDLFNBQVMsRUFBRSxZQUFZO1lBQ3ZCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ25FLGNBQWMsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUc7U0FDNUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDOUQsU0FBUyxFQUFFLG9CQUFvQjtZQUMvQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQzdFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ25FLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGtCQUFrQjtTQUM3RCxDQUFDLENBQUM7UUFFSCxNQUFNLGtCQUFrQixHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDeEUsU0FBUyxFQUFFLHlCQUF5QjtZQUNwQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxrQkFBa0I7U0FDN0QsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLGtCQUFrQixDQUFDLHVCQUF1QixDQUFDO1lBQ3pDLFNBQVMsRUFBRSxZQUFZO1lBQ3ZCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ25FLGNBQWMsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUc7U0FDNUMsQ0FBQyxDQUFDO1FBRUgsNkJBQTZCO1FBQzdCLE1BQU0sYUFBYSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3pELFVBQVUsRUFBRSxtQkFBbUI7WUFDL0IsU0FBUyxFQUFFLEtBQUs7WUFDaEIsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLGtCQUFrQjtTQUM1QyxDQUFDLENBQUM7UUFFSCxzQ0FBc0M7UUFDdEMsYUFBYSxDQUFDLFdBQVcsQ0FBQztZQUN4QixjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUNwRyxjQUFjLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSx3QkFBd0IsQ0FBQztZQUNuRSxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDckIsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDO1NBQ3pCLENBQUMsQ0FBQztRQUVILHdCQUF3QjtRQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzNELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUMzRCxlQUFlLEVBQUU7Z0JBQ2YsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQywwQ0FBMEMsQ0FBQzthQUN2RjtTQUNGLENBQUMsQ0FBQztRQUVILDZCQUE2QjtRQUM3QixVQUFVLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVsRCx1QkFBdUI7UUFDdkIsYUFBYSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUV6Qyw0QkFBNEI7UUFDNUIsUUFBUSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsMEJBQTBCLEVBQUUsdUNBQXVDLEVBQUUsNkJBQTZCLEVBQUUsMEJBQTBCLEVBQUUsMkJBQTJCLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUV0TixjQUFjO1FBQ2QsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDdkQsV0FBVyxFQUFFLGVBQWU7WUFDNUIsV0FBVyxFQUFFLHVCQUF1QjtZQUNwQywyQkFBMkIsRUFBRTtnQkFDM0IsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVztnQkFDekMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVztnQkFDekMsWUFBWSxFQUFFLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQzthQUNoRDtTQUNGLENBQUMsQ0FBQztRQUVILHFCQUFxQjtRQUNyQixNQUFNLFVBQVUsR0FBRyxJQUFJLFVBQVUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDdEYsZ0JBQWdCLEVBQUUsQ0FBQyxRQUFRLENBQUM7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsbUJBQW1CO1FBQ25CLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxJQUFZLEVBQUUsT0FBZSxFQUFFLFdBQXVDLEVBQUUsRUFBRTtZQUN0RyxPQUFPLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO2dCQUNyQyxZQUFZLEVBQUUsSUFBSTtnQkFDbEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztnQkFDbkMsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDO2dCQUM3QyxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsV0FBVyxFQUFFO29CQUNYLFdBQVcsRUFBRSxVQUFVLENBQUMsU0FBUztvQkFDakMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxTQUFTO29CQUN2QyxjQUFjLEVBQUUsYUFBYSxDQUFDLFNBQVM7b0JBQ3ZDLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDLFNBQVM7b0JBQ2pELGNBQWMsRUFBRSxhQUFhLENBQUMsVUFBVTtvQkFDeEMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxVQUFVO29CQUNqQyxhQUFhLEVBQUUsV0FBVztvQkFDMUIsR0FBRyxXQUFXO2lCQUNmO2dCQUNELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLFVBQVUsRUFBRSxHQUFHO2dCQUNmLFlBQVksRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7YUFDMUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLE1BQU0sa0JBQWtCLEdBQUcsb0JBQW9CLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ2hGLE1BQU0sa0JBQWtCLEdBQUcsb0JBQW9CLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ2hGLE1BQU0sbUJBQW1CLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ2xGLE1BQU0sMEJBQTBCLEdBQUcsb0JBQW9CLENBQUMsc0JBQXNCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFakcsTUFBTSxzQkFBc0IsR0FBRyxvQkFBb0IsQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUN6RixNQUFNLHlCQUF5QixHQUFHLG9CQUFvQixDQUFDLHFCQUFxQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQy9GLE1BQU0sMEJBQTBCLEdBQUcsb0JBQW9CLENBQUMsc0JBQXNCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDakcsTUFBTSw2QkFBNkIsR0FBRyxvQkFBb0IsQ0FBQyx5QkFBeUIsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUV2RyxNQUFNLHNCQUFzQixHQUFHLG9CQUFvQixDQUFDLGtCQUFrQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3pGLE1BQU0sc0JBQXNCLEdBQUcsb0JBQW9CLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDeEYsTUFBTSx1QkFBdUIsR0FBRyxvQkFBb0IsQ0FBQyxvQkFBb0IsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUM1RixNQUFNLHNCQUFzQixHQUFHLG9CQUFvQixDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3hGLE1BQU0sc0JBQXNCLEdBQUcsb0JBQW9CLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFeEYsTUFBTSxnQ0FBZ0MsR0FBRyxvQkFBb0IsQ0FBQyw0QkFBNEIsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUM3RyxNQUFNLDJCQUEyQixHQUFHLG9CQUFvQixDQUFDLHVCQUF1QixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ25HLE1BQU0sMkJBQTJCLEdBQUcsb0JBQW9CLENBQUMsdUJBQXVCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFbkcsTUFBTSw2QkFBNkIsR0FBRyxvQkFBb0IsQ0FBQywwQkFBMEIsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUV4RyxNQUFNLHNCQUFzQixHQUFHLG9CQUFvQixDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3hGLE1BQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFdEYsb0NBQW9DO1FBRXBDLDJCQUEyQjtRQUMzQixNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRCxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFELGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUV2RixNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFELGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUV2RixNQUFNLGVBQWUsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVELGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQUV6RixNQUFNLHNCQUFzQixHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMzRSxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQztRQUV2RyxpQkFBaUI7UUFDakIsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEQsTUFBTSxlQUFlLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1RCxlQUFlLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFO1lBQ3pGLFVBQVUsRUFBRSxVQUFVO1NBQ3ZCLENBQUMsQ0FBQztRQUNILGVBQWUsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLHlCQUF5QixDQUFDLEVBQUU7WUFDNUYsVUFBVSxFQUFFLFVBQVU7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxtQkFBbUIsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3BFLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsMEJBQTBCLENBQUMsRUFBRTtZQUNqRyxVQUFVLEVBQUUsVUFBVTtTQUN2QixDQUFDLENBQUM7UUFDSCxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLDZCQUE2QixDQUFDLEVBQUU7WUFDcEcsVUFBVSxFQUFFLFVBQVU7U0FDdkIsQ0FBQyxDQUFDO1FBRUgscUJBQXFCO1FBQ3JCLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUQsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7UUFDNUYsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFO1lBQzNGLFVBQVUsRUFBRSxVQUFVO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3RCxlQUFlLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7UUFDNUYsZUFBZSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsRUFBRTtZQUN6RixVQUFVLEVBQUUsVUFBVTtTQUN2QixDQUFDLENBQUM7UUFDSCxlQUFlLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFO1lBQzVGLFVBQVUsRUFBRSxVQUFVO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE1BQU0sa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZFLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsRUFBRTtZQUM1RixVQUFVLEVBQUUsVUFBVTtTQUN2QixDQUFDLENBQUM7UUFFSCxxQkFBcUI7UUFDckIsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxRCxNQUFNLHFCQUFxQixHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUM1RSxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGdDQUFnQyxDQUFDLEVBQUU7WUFDekcsVUFBVSxFQUFFLFVBQVU7U0FDdkIsQ0FBQyxDQUFDO1FBQ0gscUJBQXFCLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQywyQkFBMkIsQ0FBQyxFQUFFO1lBQ3JHLFVBQVUsRUFBRSxVQUFVO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE1BQU0sb0JBQW9CLEdBQUcscUJBQXFCLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZFLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsMkJBQTJCLENBQUMsRUFBRTtZQUNuRyxVQUFVLEVBQUUsVUFBVTtTQUN2QixDQUFDLENBQUM7UUFDSCxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLDJCQUEyQixDQUFDLEVBQUU7WUFDcEcsVUFBVSxFQUFFLFVBQVU7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsbUJBQW1CO1FBQ25CLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sb0JBQW9CLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN6RSxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLDZCQUE2QixDQUFDLEVBQUU7WUFDdEcsVUFBVSxFQUFFLFVBQVU7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsbUJBQW1CO1FBQ25CLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sc0JBQXNCLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0RSxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUVuRyxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlELGVBQWUsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUUxRixVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDcEMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxVQUFVO1lBQzFCLFdBQVcsRUFBRSxzQkFBc0I7U0FDcEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDN0IsS0FBSyxFQUFFLFdBQVc7WUFDMUIsV0FBVyxFQUFFLHVCQUF1QjtTQUNyQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNyQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUc7WUFDZCxXQUFXLEVBQUUsc0JBQXNCO1NBQ3BDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDM0MsS0FBSyxFQUFFLGFBQWEsQ0FBQyxVQUFVO1lBQy9CLFdBQVcsRUFBRSx3QkFBd0I7U0FDdEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbFRELHNEQWtUQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuXG5leHBvcnQgY2xhc3MgVXN1YmxlYXNlQmFja2VuZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ29nbml0byBVc2VyIFBvb2wgZm9yIEF1dGhlbnRpY2F0aW9uXG4gICAgY29uc3QgdXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnVXN1YmxlYXNlVXNlclBvb2wnLCB7XG4gICAgICB1c2VyUG9vbE5hbWU6ICd1c3VibGVhc2UtdXNlcnMnLFxuICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRydWUsXG4gICAgICBzaWduSW5BbGlhc2VzOiB7XG4gICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGdpdmVuTmFtZToge1xuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBmYW1pbHlOYW1lOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiA4LFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogZmFsc2UsXG4gICAgICB9LFxuICAgICAgYWNjb3VudFJlY292ZXJ5OiBjb2duaXRvLkFjY291bnRSZWNvdmVyeS5FTUFJTF9PTkxZLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50IC0gY2hhbmdlIGZvciBwcm9kdWN0aW9uXG4gICAgfSk7XG5cbiAgICAvLyBVc2UgZXhpc3RpbmcgQ29nbml0byBBcHAgQ2xpZW50IChjcmVhdGVkIG1hbnVhbGx5IGluIGNvbnNvbGUpXG4gICAgY29uc3QgYXBwQ2xpZW50SWQgPSAnNjBhNmljdDQ1MHZzOHNvMGhxamVuamNvaWQnO1xuXG4gICAgLy8gRHluYW1vREIgVGFibGVzXG4gICAgY29uc3QgdXNlcnNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnVXNlcnNUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogJ3VzdWJsZWFzZS11c2VycycsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBGb3IgZGV2ZWxvcG1lbnRcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3RpbmdzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0xpc3RpbmdzVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6ICd1c3VibGVhc2UtbGlzdGluZ3MnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR1NJIGZvciBsaXN0aW5ncyBieSB1bml2ZXJzaXR5XG4gICAgbGlzdGluZ3NUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICd1bml2ZXJzaXR5LWluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndW5pdmVyc2l0eScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkQXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBHU0kgZm9yIGxpc3RpbmdzIGJ5IHVzZXJcbiAgICBsaXN0aW5nc1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ3VzZXItaW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VySWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICBjb25zdCBtZXNzYWdlc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdNZXNzYWdlc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAndXN1YmxlYXNlLW1lc3NhZ2VzJyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY29udmVyc2F0aW9uSWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAndGltZXN0YW1wJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBGb3IgZGV2ZWxvcG1lbnRcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbnZlcnNhdGlvbnNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQ29udmVyc2F0aW9uc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAndXN1YmxlYXNlLWNvbnZlcnNhdGlvbnMnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR1NJIGZvciBjb252ZXJzYXRpb25zIGJ5IHVzZXJcbiAgICBjb252ZXJzYXRpb25zVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAndXNlci1pbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3VzZXJJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICd1cGRhdGVkQXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgRmlsZSBTdG9yYWdlXG4gICAgY29uc3Qgc3RvcmFnZUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1N0b3JhZ2VCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiAndXN1YmxlYXNlLXN0b3JhZ2UnLFxuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBGb3IgZGV2ZWxvcG1lbnRcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLCAvLyBGb3IgZGV2ZWxvcG1lbnRcbiAgICB9KTtcblxuICAgIC8vIEFkZCBDT1JTIGNvbmZpZ3VyYXRpb24gdG8gUzMgYnVja2V0XG4gICAgc3RvcmFnZUJ1Y2tldC5hZGRDb3JzUnVsZSh7XG4gICAgICBhbGxvd2VkTWV0aG9kczogW3MzLkh0dHBNZXRob2RzLkdFVCwgczMuSHR0cE1ldGhvZHMuUFVULCBzMy5IdHRwTWV0aG9kcy5QT1NULCBzMy5IdHRwTWV0aG9kcy5ERUxFVEVdLFxuICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnaHR0cDovL2xvY2FsaG9zdDozMDAwJywgJ2h0dHBzOi8veW91cmRvbWFpbi5jb20nXSxcbiAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgIGV4cG9zZWRIZWFkZXJzOiBbJ0VUYWcnXSxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBFeGVjdXRpb24gUm9sZVxuICAgIGNvbnN0IGxhbWJkYVJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0xhbWJkYUV4ZWN1dGlvblJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBEeW5hbW9EQiBwZXJtaXNzaW9uc1xuICAgIHVzZXJzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYVJvbGUpO1xuICAgIGxpc3RpbmdzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYVJvbGUpO1xuICAgIG1lc3NhZ2VzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYVJvbGUpO1xuICAgIGNvbnZlcnNhdGlvbnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEobGFtYmRhUm9sZSk7XG5cbiAgICAvLyBHcmFudCBTMyBwZXJtaXNzaW9uc1xuICAgIHN0b3JhZ2VCdWNrZXQuZ3JhbnRSZWFkV3JpdGUobGFtYmRhUm9sZSk7XG5cbiAgICAvLyBHcmFudCBDb2duaXRvIHBlcm1pc3Npb25zXG4gICAgdXNlclBvb2wuZ3JhbnQobGFtYmRhUm9sZSwgJ2NvZ25pdG8taWRwOkFkbWluR2V0VXNlcicsICdjb2duaXRvLWlkcDpBZG1pblVwZGF0ZVVzZXJBdHRyaWJ1dGVzJywgJ2NvZ25pdG8taWRwOkFkbWluQ3JlYXRlVXNlcicsICdjb2duaXRvLWlkcDpJbml0aWF0ZUF1dGgnLCAnY29nbml0by1pZHA6Q29uZmlybVNpZ25VcCcsICdjb2duaXRvLWlkcDpGb3Jnb3RQYXNzd29yZCcpO1xuXG4gICAgLy8gQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdVc3VibGVhc2VBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ3VzdWJsZWFzZS1hcGknLFxuICAgICAgZGVzY3JpcHRpb246ICdVU3VibGVhc2UgQmFja2VuZCBBUEknLFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJ10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ29nbml0byBBdXRob3JpemVyXG4gICAgY29uc3QgYXV0aG9yaXplciA9IG5ldyBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyKHRoaXMsICdDb2duaXRvQXV0aG9yaXplcicsIHtcbiAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFt1c2VyUG9vbF0sXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgRnVuY3Rpb25zXG4gICAgY29uc3QgY3JlYXRlTGFtYmRhRnVuY3Rpb24gPSAobmFtZTogc3RyaW5nLCBoYW5kbGVyOiBzdHJpbmcsIGVudmlyb25tZW50PzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgbmFtZSwge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IG5hbWUsXG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYGxhbWJkYS8ke25hbWV9YCksXG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgVVNFUlNfVEFCTEU6IHVzZXJzVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgIExJU1RJTkdTX1RBQkxFOiBsaXN0aW5nc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICBNRVNTQUdFU19UQUJMRTogbWVzc2FnZXNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgQ09OVkVSU0FUSU9OU19UQUJMRTogY29udmVyc2F0aW9uc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICBTVE9SQUdFX0JVQ0tFVDogc3RvcmFnZUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICAgIFVTRVJfUE9PTF9JRDogdXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgICAgICBBUFBfQ0xJRU5UX0lEOiBhcHBDbGllbnRJZCxcbiAgICAgICAgICAuLi5lbnZpcm9ubWVudCxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIENyZWF0ZSBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgYXV0aFNpZ251cEZ1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ2F1dGgtc2lnbnVwJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBhdXRoU2lnbmluRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignYXV0aC1zaWduaW4nLCAnaW5kZXguaGFuZGxlcicpO1xuICAgIGNvbnN0IGF1dGhDb25maXJtRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignYXV0aC1jb25maXJtJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBhdXRoRm9yZ290UGFzc3dvcmRGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCdhdXRoLWZvcmdvdC1wYXNzd29yZCcsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgXG4gICAgY29uc3QgdXNlckdldFByb2ZpbGVGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCd1c2VyLWdldC1wcm9maWxlJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCB1c2VyVXBkYXRlUHJvZmlsZUZ1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ3VzZXItdXBkYXRlLXByb2ZpbGUnLCAnaW5kZXguaGFuZGxlcicpO1xuICAgIGNvbnN0IHVzZXJHZXRQcmVmZXJlbmNlc0Z1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ3VzZXItZ2V0LXByZWZlcmVuY2VzJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCB1c2VyVXBkYXRlUHJlZmVyZW5jZXNGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCd1c2VyLXVwZGF0ZS1wcmVmZXJlbmNlcycsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgXG4gICAgY29uc3QgbGlzdGluZ3NHZXRBbGxGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCdsaXN0aW5ncy1nZXQtYWxsJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBsaXN0aW5nc0NyZWF0ZUZ1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ2xpc3RpbmdzLWNyZWF0ZScsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgY29uc3QgbGlzdGluZ3NHZXRCeUlkRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignbGlzdGluZ3MtZ2V0LWJ5LWlkJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBsaXN0aW5nc1VwZGF0ZUZ1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ2xpc3RpbmdzLXVwZGF0ZScsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgY29uc3QgbGlzdGluZ3NEZWxldGVGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCdsaXN0aW5ncy1kZWxldGUnLCAnaW5kZXguaGFuZGxlcicpO1xuICAgIFxuICAgIGNvbnN0IG1lc3NhZ2VzR2V0Q29udmVyc2F0aW9uc0Z1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ21lc3NhZ2VzLWdldC1jb252ZXJzYXRpb25zJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBtZXNzYWdlc0dldE1lc3NhZ2VzRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignbWVzc2FnZXMtZ2V0LW1lc3NhZ2VzJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBtZXNzYWdlc1NlbmRNZXNzYWdlRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignbWVzc2FnZXMtc2VuZC1tZXNzYWdlJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBcbiAgICBjb25zdCB1cGxvYWRHZXRQcmVzaWduZWRVcmxGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCd1cGxvYWQtZ2V0LXByZXNpZ25lZC11cmwnLCAnaW5kZXguaGFuZGxlcicpO1xuICAgIFxuICAgIGNvbnN0IHNlYXJjaExpc3RpbmdzRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignc2VhcmNoLWxpc3RpbmdzJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBzZWFyY2hHZW9jb2RlRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignc2VhcmNoLWdlb2NvZGUnLCAnaW5kZXguaGFuZGxlcicpO1xuXG4gICAgLy8gQVBJIEdhdGV3YXkgUmVzb3VyY2VzIGFuZCBNZXRob2RzXG4gICAgXG4gICAgLy8gQXV0aGVudGljYXRpb24gZW5kcG9pbnRzXG4gICAgY29uc3QgYXV0aFJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2F1dGgnKTtcbiAgICBjb25zdCBzaWdudXBSZXNvdXJjZSA9IGF1dGhSZXNvdXJjZS5hZGRSZXNvdXJjZSgnc2lnbnVwJyk7XG4gICAgc2lnbnVwUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYXV0aFNpZ251cEZ1bmN0aW9uKSk7XG4gICAgXG4gICAgY29uc3Qgc2lnbmluUmVzb3VyY2UgPSBhdXRoUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3NpZ25pbicpO1xuICAgIHNpZ25pblJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGF1dGhTaWduaW5GdW5jdGlvbikpO1xuICAgIFxuICAgIGNvbnN0IGNvbmZpcm1SZXNvdXJjZSA9IGF1dGhSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY29uZmlybScpO1xuICAgIGNvbmZpcm1SZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhdXRoQ29uZmlybUZ1bmN0aW9uKSk7XG4gICAgXG4gICAgY29uc3QgZm9yZ290UGFzc3dvcmRSZXNvdXJjZSA9IGF1dGhSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZm9yZ290LXBhc3N3b3JkJyk7XG4gICAgZm9yZ290UGFzc3dvcmRSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhdXRoRm9yZ290UGFzc3dvcmRGdW5jdGlvbikpO1xuXG4gICAgLy8gVXNlciBlbmRwb2ludHNcbiAgICBjb25zdCB1c2VyUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgndXNlcicpO1xuICAgIGNvbnN0IHByb2ZpbGVSZXNvdXJjZSA9IHVzZXJSZXNvdXJjZS5hZGRSZXNvdXJjZSgncHJvZmlsZScpO1xuICAgIHByb2ZpbGVSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHVzZXJHZXRQcm9maWxlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIHByb2ZpbGVSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHVzZXJVcGRhdGVQcm9maWxlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHByZWZlcmVuY2VzUmVzb3VyY2UgPSB1c2VyUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3ByZWZlcmVuY2VzJyk7XG4gICAgcHJlZmVyZW5jZXNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHVzZXJHZXRQcmVmZXJlbmNlc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICBwcmVmZXJlbmNlc1Jlc291cmNlLmFkZE1ldGhvZCgnUFVUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odXNlclVwZGF0ZVByZWZlcmVuY2VzRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gTGlzdGluZ3MgZW5kcG9pbnRzXG4gICAgY29uc3QgbGlzdGluZ3NSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdsaXN0aW5ncycpO1xuICAgIGxpc3RpbmdzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0aW5nc0dldEFsbEZ1bmN0aW9uKSk7XG4gICAgbGlzdGluZ3NSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0aW5nc0NyZWF0ZUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3RpbmdSZXNvdXJjZSA9IGxpc3RpbmdzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBsaXN0aW5nUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0aW5nc0dldEJ5SWRGdW5jdGlvbikpO1xuICAgIGxpc3RpbmdSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxpc3RpbmdzVXBkYXRlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGxpc3RpbmdSZXNvdXJjZS5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxpc3RpbmdzRGVsZXRlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbXlMaXN0aW5nc1Jlc291cmNlID0gbGlzdGluZ3NSZXNvdXJjZS5hZGRSZXNvdXJjZSgnbXktbGlzdGluZ3MnKTtcbiAgICBteUxpc3RpbmdzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0aW5nc0dldEFsbEZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIE1lc3NhZ2VzIGVuZHBvaW50c1xuICAgIGNvbnN0IG1lc3NhZ2VzUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnbWVzc2FnZXMnKTtcbiAgICBjb25zdCBjb252ZXJzYXRpb25zUmVzb3VyY2UgPSBtZXNzYWdlc1Jlc291cmNlLmFkZFJlc291cmNlKCdjb252ZXJzYXRpb25zJyk7XG4gICAgY29udmVyc2F0aW9uc1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obWVzc2FnZXNHZXRDb252ZXJzYXRpb25zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGNvbnZlcnNhdGlvbnNSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihtZXNzYWdlc1NlbmRNZXNzYWdlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY29udmVyc2F0aW9uUmVzb3VyY2UgPSBjb252ZXJzYXRpb25zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBjb252ZXJzYXRpb25SZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKG1lc3NhZ2VzR2V0TWVzc2FnZXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IGF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgY29udmVyc2F0aW9uUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obWVzc2FnZXNTZW5kTWVzc2FnZUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFVwbG9hZCBlbmRwb2ludHNcbiAgICBjb25zdCB1cGxvYWRSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCd1cGxvYWQnKTtcbiAgICBjb25zdCBwcmVzaWduZWRVcmxSZXNvdXJjZSA9IHVwbG9hZFJlc291cmNlLmFkZFJlc291cmNlKCdwcmVzaWduZWQtdXJsJyk7XG4gICAgcHJlc2lnbmVkVXJsUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odXBsb2FkR2V0UHJlc2lnbmVkVXJsRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gU2VhcmNoIGVuZHBvaW50c1xuICAgIGNvbnN0IHNlYXJjaFJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3NlYXJjaCcpO1xuICAgIGNvbnN0IHNlYXJjaExpc3RpbmdzUmVzb3VyY2UgPSBzZWFyY2hSZXNvdXJjZS5hZGRSZXNvdXJjZSgnbGlzdGluZ3MnKTtcbiAgICBzZWFyY2hMaXN0aW5nc1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHNlYXJjaExpc3RpbmdzRnVuY3Rpb24pKTtcbiAgICBcbiAgICBjb25zdCBnZW9jb2RlUmVzb3VyY2UgPSBzZWFyY2hSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZ2VvY29kZScpO1xuICAgIGdlb2NvZGVSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHNlYXJjaEdlb2NvZGVGdW5jdGlvbikpO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIElEJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcHBDbGllbnRJZCcsIHtcbiAgICAgICAgICAgICAgdmFsdWU6IGFwcENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIEFwcCBDbGllbnQgSUQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IEVuZHBvaW50JyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTdG9yYWdlQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBzdG9yYWdlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIFN0b3JhZ2UgQnVja2V0IE5hbWUnLFxuICAgIH0pO1xuICB9XG59ICJdfQ==