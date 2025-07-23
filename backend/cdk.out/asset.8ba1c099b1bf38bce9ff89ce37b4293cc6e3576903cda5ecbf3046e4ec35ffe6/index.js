const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const userId = event.requestContext.authorizer?.claims?.sub;
    
    let params = {
      TableName: process.env.LISTINGS_TABLE
    };
    
    // If user is authenticated and requesting their own listings
    if (userId && event.path.includes('/my-listings')) {
      params.IndexName = 'user-index';
      params.KeyConditionExpression = 'userId = :userId';
      params.ExpressionAttributeValues = {
        ':userId': userId
      };
      const result = await dynamodb.query(params).promise();
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        body: JSON.stringify({
          listings: result.Items,
          lastEvaluatedKey: result.LastEvaluatedKey
        })
      };
    } else {
      // Get all listings or filter by university
      if (queryParams.university) {
        params.IndexName = 'university-index';
        params.KeyConditionExpression = '#university = :university';
        params.ExpressionAttributeNames = {
          '#university': 'university'
        };
        params.ExpressionAttributeValues = {
          ':university': queryParams.university
        };
        
        const result = await dynamodb.query(params).promise();
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
          },
          body: JSON.stringify({
            listings: result.Items,
            lastEvaluatedKey: result.LastEvaluatedKey
          })
        };
      } else {
        // Get all listings - use scan operation
        params.ScanIndexForward = false; // Most recent first
        
        // Add pagination
        if (queryParams.limit) {
          params.Limit = parseInt(queryParams.limit);
        }
        
        if (queryParams.lastEvaluatedKey) {
          params.ExclusiveStartKey = JSON.parse(queryParams.lastEvaluatedKey);
        }
        
        const result = await dynamodb.scan(params).promise();
        
        // Sort by created_at descending (most recent first)
        const sortedItems = result.Items.sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
          },
          body: JSON.stringify({
            listings: sortedItems,
            lastEvaluatedKey: result.LastEvaluatedKey
          })
        };
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 