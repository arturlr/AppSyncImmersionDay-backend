// 1. Import dependencies
const cdk = require('aws-cdk-lib');
const db = require('aws-cdk-lib/aws-dynamodb');
const appsync = require('aws-cdk-lib/aws-appsync');
const cognito = require('aws-cdk-lib/aws-cognito');
const lambda = require('aws-cdk-lib/aws-lambda');

// 2.a. setup a static expiration date for the API KEY
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const WORKSHOP_DATE = new Date(); // date of this workshop
const KEY_EXPIRATION_DATE = new Date(WORKSHOP_DATE.getTime() + SEVEN_DAYS);

class AnyCompanyReadsBackendStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        // 2.b. Configure the User Pool & Client
        this.pool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'WorkshopUserPool',
            selfSignUpEnabled: true,
            autoVerify: { email: true },
            standardAttributes: { email: { required: true } },
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const client = this.pool.addClient('customer-app-client-web', {
            preventUserExistenceErrors: true,
            authFlows: {
                userPassword: true,
                userSrp: true,
            }
        });


        // 3. Define the AppSync API
        this.api = new appsync.GraphqlApi(this, 'AppSyncBooksAPI', {
            name: 'BooksAPI-CDK',
            definition: appsync.Definition.fromFile('appsync/schemas/bookSchema.graphql'),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: 'API_KEY',
                    apiKeyConfig: {
                        name: 'default',
                        description: 'default auth mode',
                        expires: cdk.Expiration.atDate(KEY_EXPIRATION_DATE)
                    }
                },
                additionalAuthorizationModes: [{
                    authorizationType: appsync.AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: this.pool,
                    }
                }]
            },
        });



        // 4.a. Define the DynamoDB table with partition key and additional DDB indexes
        const table = new db.Table(this, 'BooksTable-CDK', {
            partitionKey: { name: 'id', type: db.AttributeType.STRING },
            billingMode: db.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        table.addGlobalSecondaryIndex({
            indexName: 'author-index',
            partitionKey: { name: 'authorId', type: db.AttributeType.STRING }
        });

        table.addGlobalSecondaryIndex({
            indexName: 'publisher-index',
            partitionKey: { name: 'publisherId', type: db.AttributeType.STRING }
        });


        // 4.b Define the custom auth Lambda function
        const customAuthFunction = new lambda.Function(this, "CustomAuthFunction", {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "index.handler",
            code: lambda.Code.fromAsset("lambda/custom-auth"),
            environment: {
                ALLOW: "true"
            }
        });


        // 5.a. Set up table as a data source
        const dataSource = this.api.addDynamoDbDataSource('BooksTableSource', table);


        // 5.b Set up custom auth lambda function as a data source
        const lambdaDataSource = this.api.addLambdaDataSource('CustomAuthLambda', customAuthFunction);


        // 6.a Define AppSync functions for Pipeline resolvers
        const appsyncCustomAuthFunction = lambdaDataSource.createFunction('AppSyncCustomAuthFunction', {
            name: 'AppSyncCustomAuthFunction',
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/customAuthFunction.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });

        const appsyncListBooksByGenreFunction = dataSource.createFunction('AppSyncListBooksByGenreFunction', {
            name: 'AppSyncListBooksByGenreFunction',
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/queryListBooksByGenre.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });


        // 6.b. Define resolvers
        this.api.createResolver('MutationCreateBookResolver', {
            typeName: 'Mutation',
            fieldName: 'createBook',
            dataSource: dataSource,
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/mutationCreateBook.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });

        this.api.createResolver('MutationUpdateBookResolver', {
            typeName: 'Mutation',
            fieldName: 'updateBook',
            dataSource: dataSource,
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/mutationUpdateBook.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });

        this.api.createResolver('MutationDeleteBookResolver', {
            typeName: 'Mutation',
            fieldName: 'deleteBook',
            dataSource: dataSource,
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/mutationDeleteBook.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });

        this.api.createResolver('QueryGetBookResolver', {
            typeName: 'Query',
            fieldName: 'getBook',
            dataSource: dataSource,
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/queryGetBook.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });
        
        this.api.createResolver('QueryListBooksByGenreResolver', {
            typeName: 'Query',
            fieldName: 'listBooksByGenre',
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/default.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            pipelineConfig: [appsyncCustomAuthFunction, appsyncListBooksByGenreFunction]
        });



        this.api.createResolver('QueryListBooksResolver', {
            typeName: 'Query',
            fieldName: 'listBooks',
            dataSource: dataSource,
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/queryListBooks.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });

        this.api.createResolver('QueryBooksByAuthorIndexResolver', {
            typeName: 'Query',
            fieldName: 'queryBooksByAuthorIndex',
            dataSource: dataSource,
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/queryBooksByAuthorIndex.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });

        this.api.createResolver('QueryBooksByPublisherIndexResolver', {
            typeName: 'Query',
            fieldName: 'queryBooksByPublisherIndex',
            dataSource: dataSource,
            code: appsync.Code.fromAsset('appsync/resolvers/booksApi/js/queryBooksByPublisherIndex.js'),
            runtime: appsync.FunctionRuntime.JS_1_0_0
        });


        // 7. Stack outputs
        new cdk.CfnOutput(this, 'USER_POOLS_ID', { value: this.pool.userPoolId });
        new cdk.CfnOutput(this, 'USER_POOLS_WEB_CLIENT_ID', { value: client.userPoolClientId });
        new cdk.CfnOutput(this, 'GraphQLAPI_ID', { value: this.api.apiId });
        new cdk.CfnOutput(this, 'GraphQLAPI_URL', { value: this.api.graphqlUrl });
        new cdk.CfnOutput(this, 'GraphQLAPI_KEY', { value: this.api.apiKey });
        new cdk.CfnOutput(this, 'STACK_REGION', { value: this.region });


    }
}

module.exports = { AnyCompanyReadsBackendStack };