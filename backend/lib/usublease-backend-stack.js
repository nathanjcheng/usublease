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
        // Cognito App Client
        const appClient = new cognito.UserPoolClient(this, 'UsubleaseAppClient', {
            userPool,
            userPoolClientName: 'usublease-web-client',
            generateSecret: true,
            authFlows: {
                adminUserPassword: true,
                userPassword: true,
                userSrp: true,
            },
            oAuth: {
                flows: {
                    implicitCodeGrant: true,
                },
                callbackUrls: [
                    'http://localhost:3000/',
                    'https://yourdomain.com/',
                ],
                logoutUrls: [
                    'http://localhost:3000/',
                    'https://yourdomain.com/',
                ],
            },
        });
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
        userPool.grant(lambdaRole, 'cognito-idp:AdminGetUser', 'cognito-idp:AdminUpdateUserAttributes', 'cognito-idp:AdminCreateUser');
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
                    ...environment,
                },
                timeout: cdk.Duration.seconds(30),
                memorySize: 256,
                logRetention: logs.RetentionDays.ONE_WEEK,
            });
        };
        // Create Lambda functions
        const authSignupFunction = createLambdaFunction('auth-signup', 'index.handler');
        const userGetProfileFunction = createLambdaFunction('user-get-profile', 'index.handler');
        const userUpdateProfileFunction = createLambdaFunction('user-update-profile', 'index.handler');
        const listingsGetAllFunction = createLambdaFunction('listings-get-all', 'index.handler');
        const listingsCreateFunction = createLambdaFunction('listings-create', 'index.handler');
        const listingsGetByIdFunction = createLambdaFunction('listings-get-by-id', 'index.handler');
        const listingsUpdateFunction = createLambdaFunction('listings-update', 'index.handler');
        const listingsDeleteFunction = createLambdaFunction('listings-delete', 'index.handler');
        const messagesGetConversationsFunction = createLambdaFunction('messages-get-conversations', 'index.handler');
        const messagesGetMessagesFunction = createLambdaFunction('messages-get-messages', 'index.handler');
        const messagesSendMessageFunction = createLambdaFunction('messages-send-message', 'index.handler');
        const uploadGetPresignedUrlFunction = createLambdaFunction('upload-get-presigned-url', 'index.handler');
        const searchGeocodeFunction = createLambdaFunction('search-geocode', 'index.handler');
        // API Gateway Resources and Methods
        const authResource = api.root.addResource('auth');
        const signupResource = authResource.addResource('signup');
        signupResource.addMethod('POST', new apigateway.LambdaIntegration(authSignupFunction));
        const userResource = api.root.addResource('user');
        const profileResource = userResource.addResource('profile');
        profileResource.addMethod('GET', new apigateway.LambdaIntegration(userGetProfileFunction), {
            authorizer: authorizer,
        });
        profileResource.addMethod('PUT', new apigateway.LambdaIntegration(userUpdateProfileFunction), {
            authorizer: authorizer,
        });
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
        const uploadResource = api.root.addResource('upload');
        const presignedUrlResource = uploadResource.addResource('presigned-url');
        presignedUrlResource.addMethod('POST', new apigateway.LambdaIntegration(uploadGetPresignedUrlFunction), {
            authorizer: authorizer,
        });
        const searchResource = api.root.addResource('search');
        const geocodeResource = searchResource.addResource('geocode');
        geocodeResource.addMethod('GET', new apigateway.LambdaIntegration(searchGeocodeFunction));
        // Outputs
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId,
            description: 'Cognito User Pool ID',
        });
        new cdk.CfnOutput(this, 'AppClientId', {
            value: appClient.userPoolClientId,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXN1YmxlYXNlLWJhY2tlbmQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c3VibGVhc2UtYmFja2VuZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsbURBQW1EO0FBQ25ELHFEQUFxRDtBQUNyRCx5Q0FBeUM7QUFDekMseURBQXlEO0FBQ3pELGlEQUFpRDtBQUNqRCwyQ0FBMkM7QUFDM0MsNkNBQTZDO0FBRTdDLE1BQWEscUJBQXNCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDbEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix1Q0FBdUM7UUFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMvRCxZQUFZLEVBQUUsaUJBQWlCO1lBQy9CLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsYUFBYSxFQUFFO2dCQUNiLEtBQUssRUFBRSxJQUFJO2FBQ1o7WUFDRCxrQkFBa0IsRUFBRTtnQkFDbEIsS0FBSyxFQUFFO29CQUNMLFFBQVEsRUFBRSxJQUFJO29CQUNkLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxRQUFRLEVBQUUsS0FBSztvQkFDZixPQUFPLEVBQUUsSUFBSTtpQkFDZDtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7YUFDRjtZQUNELGNBQWMsRUFBRTtnQkFDZCxTQUFTLEVBQUUsQ0FBQztnQkFDWixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsY0FBYyxFQUFFLEtBQUs7YUFDdEI7WUFDRCxlQUFlLEVBQUUsT0FBTyxD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QVUsQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFFMUYsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BDLEtBQUssRUFBRSxRQUFRLENBQUMsVUFBVTtZQUMxQixXQUFXLEVBQUUsc0JBQXNCO1NBQ3BDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3JDLEtBQUssRUFBRSxTQUFTLENBQUMsZ0JBQWdCO1lBQ2pDLFdBQVcsRUFBRSx1QkFBdUI7U0FDckMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHO1lBQ2QsV0FBVyxFQUFFLHNCQUFzQjtTQUNwQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxhQUFhLENBQUMsVUFBVTtZQUMvQixXQUFXLEVBQUUsd0JBQXdCO1NBQ3RDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWpTRCxzREFpU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcblxuZXhwb3J0IGNsYXNzIFVzdWJsZWFzZUJhY2tlbmRTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENvZ25pdG8gVXNlciBQb29sIGZvciBBdXRoZW50aWNhdGlvblxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ1VzdWJsZWFzZVVzZXJQb29sJywge1xuICAgICAgdXNlclBvb2xOYW1lOiAndXN1YmxlYXNlLXVzZXJzJyxcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBzdGFuZGFyZEF0dHJpYnV0ZXM6IHtcbiAgICAgICAgZW1haWw6IHtcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBnaXZlbk5hbWU6IHtcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZmFtaWx5TmFtZToge1xuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogOCxcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIGFjY291bnRSZWNvdmVyeTogY29nbml0by5BY2NvdW50UmVjb3ZlcnkuRU1BSUxfT05MWSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIEZvciBkZXZlbG9wbWVudCAtIGNoYW5nZSBmb3IgcHJvZHVjdGlvblxuICAgIH0pO1xuXG4gICAgLy8gQ29nbml0byBBcHAgQ2xpZW50XG4gICAgY29uc3QgYXBwQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ1VzdWJsZWFzZUFwcENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sLFxuICAgICAgdXNlclBvb2xDbGllbnROYW1lOiAndXN1YmxlYXNlLXdlYi1jbGllbnQnLFxuICAgICAgZ2VuZXJhdGVTZWNyZXQ6IHRydWUsXG4gICAgICBhdXRoRmxvd3M6IHtcbiAgICAgICAgYWRtaW5Vc2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgdXNlclNycDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBvQXV0aDoge1xuICAgICAgICBmbG93czoge1xuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBjYWxsYmFja1VybHM6IFtcbiAgICAgICAgICAnaHR0cDovL2xvY2FsaG9zdDozMDAwLycsXG4gICAgICAgICAgJ2h0dHBzOi8veW91cmRvbWFpbi5jb20vJyxcbiAgICAgICAgXSxcbiAgICAgICAgbG9nb3V0VXJsczogW1xuICAgICAgICAgICdodHRwOi8vbG9jYWxob3N0OjMwMDAvJyxcbiAgICAgICAgICAnaHR0cHM6Ly95b3VyZG9tYWluLmNvbS8nLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIER5bmFtb0RCIFRhYmxlc1xuICAgIGNvbnN0IHVzZXJzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1VzZXJzVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6ICd1c3VibGVhc2UtdXNlcnMnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50XG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0aW5nc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdMaXN0aW5nc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAndXN1YmxlYXNlLWxpc3RpbmdzJyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIEZvciBkZXZlbG9wbWVudFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIEdTSSBmb3IgbGlzdGluZ3MgYnkgdW5pdmVyc2l0eVxuICAgIGxpc3RpbmdzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAndW5pdmVyc2l0eS1pbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3VuaXZlcnNpdHknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR1NJIGZvciBsaXN0aW5ncyBieSB1c2VyXG4gICAgbGlzdGluZ3NUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICd1c2VyLWluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRBdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVzc2FnZXNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnTWVzc2FnZXNUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogJ3VzdWJsZWFzZS1tZXNzYWdlcycsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NvbnZlcnNhdGlvbklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RpbWVzdGFtcCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50XG4gICAgfSk7XG5cbiAgICBjb25zdCBjb252ZXJzYXRpb25zVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0NvbnZlcnNhdGlvbnNUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogJ3VzdWJsZWFzZS1jb252ZXJzYXRpb25zJyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIEZvciBkZXZlbG9wbWVudFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIEdTSSBmb3IgY29udmVyc2F0aW9ucyBieSB1c2VyXG4gICAgY29udmVyc2F0aW9uc1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ3VzZXItaW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VySWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAndXBkYXRlZEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyBTMyBCdWNrZXQgZm9yIEZpbGUgU3RvcmFnZVxuICAgIGNvbnN0IHN0b3JhZ2VCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdTdG9yYWdlQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogJ3VzdWJsZWFzZS1zdG9yYWdlJyxcbiAgICAgIHZlcnNpb25lZDogZmFsc2UsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50XG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSwgLy8gRm9yIGRldmVsb3BtZW50XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgQ09SUyBjb25maWd1cmF0aW9uIHRvIFMzIGJ1Y2tldFxuICAgIHN0b3JhZ2VCdWNrZXQuYWRkQ29yc1J1bGUoe1xuICAgICAgYWxsb3dlZE1ldGhvZHM6IFtzMy5IdHRwTWV0aG9kcy5HRVQsIHMzLkh0dHBNZXRob2RzLlBVVCwgczMuSHR0cE1ldGhvZHMuUE9TVCwgczMuSHR0cE1ldGhvZHMuREVMRVRFXSxcbiAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsICdodHRwczovL3lvdXJkb21haW4uY29tJ10sXG4gICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXG4gICAgICBleHBvc2VkSGVhZGVyczogWydFVGFnJ10sXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgRXhlY3V0aW9uIFJvbGVcbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdMYW1iZGFFeGVjdXRpb25Sb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgRHluYW1vREIgcGVybWlzc2lvbnNcbiAgICB1c2Vyc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFSb2xlKTtcbiAgICBsaXN0aW5nc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFSb2xlKTtcbiAgICBtZXNzYWdlc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFSb2xlKTtcbiAgICBjb252ZXJzYXRpb25zVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYVJvbGUpO1xuXG4gICAgLy8gR3JhbnQgUzMgcGVybWlzc2lvbnNcbiAgICBzdG9yYWdlQnVja2V0LmdyYW50UmVhZFdyaXRlKGxhbWJkYVJvbGUpO1xuXG4gICAgLy8gR3JhbnQgQ29nbml0byBwZXJtaXNzaW9uc1xuICAgIHVzZXJQb29sLmdyYW50KGxhbWJkYVJvbGUsICdjb2duaXRvLWlkcDpBZG1pbkdldFVzZXInLCAnY29nbml0by1pZHA6QWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlcycsICdjb2duaXRvLWlkcDpBZG1pbkNyZWF0ZVVzZXInKTtcblxuICAgIC8vIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnVXN1YmxlYXNlQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICd1c3VibGVhc2UtYXBpJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVVN1YmxlYXNlIEJhY2tlbmQgQVBJJyxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENvZ25pdG8gQXV0aG9yaXplclxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcih0aGlzLCAnQ29nbml0b0F1dGhvcml6ZXInLCB7XG4gICAgICBjb2duaXRvVXNlclBvb2xzOiBbdXNlclBvb2xdLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uc1xuICAgIGNvbnN0IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uID0gKG5hbWU6IHN0cmluZywgaGFuZGxlcjogc3RyaW5nLCBlbnZpcm9ubWVudD86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0pID0+IHtcbiAgICAgIHJldHVybiBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIG5hbWUsIHtcbiAgICAgICAgZnVuY3Rpb25OYW1lOiBuYW1lLFxuICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGBsYW1iZGEvJHtuYW1lfWApLFxuICAgICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIFVTRVJTX1RBQkxFOiB1c2Vyc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICBMSVNUSU5HU19UQUJMRTogbGlzdGluZ3NUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgTUVTU0FHRVNfVEFCTEU6IG1lc3NhZ2VzVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgIENPTlZFUlNBVElPTlNfVEFCTEU6IGNvbnZlcnNhdGlvbnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgU1RPUkFHRV9CVUNLRVQ6IHN0b3JhZ2VCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgICBVU0VSX1BPT0xfSUQ6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICAgICAgLi4uZW52aXJvbm1lbnQsXG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGF1dGhTaWdudXBGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCdhdXRoLXNpZ251cCcsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgY29uc3QgdXNlckdldFByb2ZpbGVGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCd1c2VyLWdldC1wcm9maWxlJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCB1c2VyVXBkYXRlUHJvZmlsZUZ1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ3VzZXItdXBkYXRlLXByb2ZpbGUnLCAnaW5kZXguaGFuZGxlcicpO1xuICAgIGNvbnN0IGxpc3RpbmdzR2V0QWxsRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignbGlzdGluZ3MtZ2V0LWFsbCcsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgY29uc3QgbGlzdGluZ3NDcmVhdGVGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCdsaXN0aW5ncy1jcmVhdGUnLCAnaW5kZXguaGFuZGxlcicpO1xuICAgIGNvbnN0IGxpc3RpbmdzR2V0QnlJZEZ1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ2xpc3RpbmdzLWdldC1ieS1pZCcsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgY29uc3QgbGlzdGluZ3NVcGRhdGVGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCdsaXN0aW5ncy11cGRhdGUnLCAnaW5kZXguaGFuZGxlcicpO1xuICAgIGNvbnN0IGxpc3RpbmdzRGVsZXRlRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignbGlzdGluZ3MtZGVsZXRlJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBtZXNzYWdlc0dldENvbnZlcnNhdGlvbnNGdW5jdGlvbiA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKCdtZXNzYWdlcy1nZXQtY29udmVyc2F0aW9ucycsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgY29uc3QgbWVzc2FnZXNHZXRNZXNzYWdlc0Z1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ21lc3NhZ2VzLWdldC1tZXNzYWdlcycsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgY29uc3QgbWVzc2FnZXNTZW5kTWVzc2FnZUZ1bmN0aW9uID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oJ21lc3NhZ2VzLXNlbmQtbWVzc2FnZScsICdpbmRleC5oYW5kbGVyJyk7XG4gICAgY29uc3QgdXBsb2FkR2V0UHJlc2lnbmVkVXJsRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbigndXBsb2FkLWdldC1wcmVzaWduZWQtdXJsJywgJ2luZGV4LmhhbmRsZXInKTtcbiAgICBjb25zdCBzZWFyY2hHZW9jb2RlRnVuY3Rpb24gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbignc2VhcmNoLWdlb2NvZGUnLCAnaW5kZXguaGFuZGxlcicpO1xuXG4gICAgLy8gQVBJIEdhdGV3YXkgUmVzb3VyY2VzIGFuZCBNZXRob2RzXG4gICAgY29uc3QgYXV0aFJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2F1dGgnKTtcbiAgICBjb25zdCBzaWdudXBSZXNvdXJjZSA9IGF1dGhSZXNvdXJjZS5hZGRSZXNvdXJjZSgnc2lnbnVwJyk7XG4gICAgc2lnbnVwUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYXV0aFNpZ251cEZ1bmN0aW9uKSk7XG5cbiAgICBjb25zdCB1c2VyUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgndXNlcicpO1xuICAgIGNvbnN0IHByb2ZpbGVSZXNvdXJjZSA9IHVzZXJSZXNvdXJjZS5hZGRSZXNvdXJjZSgncHJvZmlsZScpO1xuICAgIHByb2ZpbGVSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHVzZXJHZXRQcm9maWxlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIHByb2ZpbGVSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHVzZXJVcGRhdGVQcm9maWxlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbGlzdGluZ3NSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdsaXN0aW5ncycpO1xuICAgIGxpc3RpbmdzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0aW5nc0dldEFsbEZ1bmN0aW9uKSk7XG4gICAgbGlzdGluZ3NSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0aW5nc0NyZWF0ZUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3RpbmdSZXNvdXJjZSA9IGxpc3RpbmdzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBsaXN0aW5nUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0aW5nc0dldEJ5SWRGdW5jdGlvbikpO1xuICAgIGxpc3RpbmdSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxpc3RpbmdzVXBkYXRlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGxpc3RpbmdSZXNvdXJjZS5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxpc3RpbmdzRGVsZXRlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbXlMaXN0aW5nc1Jlc291cmNlID0gbGlzdGluZ3NSZXNvdXJjZS5hZGRSZXNvdXJjZSgnbXktbGlzdGluZ3MnKTtcbiAgICBteUxpc3RpbmdzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0aW5nc0dldEFsbEZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IG1lc3NhZ2VzUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnbWVzc2FnZXMnKTtcbiAgICBjb25zdCBjb252ZXJzYXRpb25zUmVzb3VyY2UgPSBtZXNzYWdlc1Jlc291cmNlLmFkZFJlc291cmNlKCdjb252ZXJzYXRpb25zJyk7XG4gICAgY29udmVyc2F0aW9uc1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obWVzc2FnZXNHZXRDb252ZXJzYXRpb25zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGNvbnZlcnNhdGlvbnNSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihtZXNzYWdlc1NlbmRNZXNzYWdlRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY29udmVyc2F0aW9uUmVzb3VyY2UgPSBjb252ZXJzYXRpb25zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBjb252ZXJzYXRpb25SZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKG1lc3NhZ2VzR2V0TWVzc2FnZXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IGF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgY29udmVyc2F0aW9uUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obWVzc2FnZXNTZW5kTWVzc2FnZUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHVwbG9hZFJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3VwbG9hZCcpO1xuICAgIGNvbnN0IHByZXNpZ25lZFVybFJlc291cmNlID0gdXBsb2FkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3ByZXNpZ25lZC11cmwnKTtcbiAgICBwcmVzaWduZWRVcmxSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGxvYWRHZXRQcmVzaWduZWRVcmxGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IGF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZWFyY2hSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdzZWFyY2gnKTtcbiAgICBjb25zdCBnZW9jb2RlUmVzb3VyY2UgPSBzZWFyY2hSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZ2VvY29kZScpO1xuICAgIGdlb2NvZGVSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHNlYXJjaEdlb2NvZGVGdW5jdGlvbikpO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIElEJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcHBDbGllbnRJZCcsIHtcbiAgICAgIHZhbHVlOiBhcHBDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBBcHAgQ2xpZW50IElEJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSBFbmRwb2ludCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3RvcmFnZUJ1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogc3RvcmFnZUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdTMyBTdG9yYWdlIEJ1Y2tldCBOYW1lJyxcbiAgICB9KTtcbiAgfVxufSAiXX0=