const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { 
      university, 
      minPrice, 
      maxPrice, 
      location, 
      amenities, 
      availableFrom, 
      availableTo,
      limit = 20,
      lastEvaluatedKey 
    } = body;
    
    let params = {
      TableName: process.env.LISTINGS_TABLE,
      Limit: parseInt(limit)
    };
    
    // If university is specified, use the university index
    if (university) {
      params.IndexName = 'university-index';
      params.KeyConditionExpression = '#university = :university';
      params.ExpressionAttributeNames = {
        '#university': 'university'
      };
      params.ExpressionAttributeValues = {
        ':university': university
      };
    }
    
    // Add filter expressions
    const filterExpressions = [];
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined && maxPrice !== undefined) {
        filterExpressions.push('#price BETWEEN :minPrice AND :maxPrice');
        params.ExpressionAttributeValues[':minPrice'] = minPrice;
        params.ExpressionAttributeValues[':maxPrice'] = maxPrice;
      } else if (minPrice !== undefined) {
        filterExpressions.push('#price >= :minPrice');
        params.ExpressionAttributeValues[':minPrice'] = minPrice;
      } else if (maxPrice !== undefined) {
        filterExpressions.push('#price <= :maxPrice');
        params.ExpressionAttributeValues[':maxPrice'] = maxPrice;
      }
      params.ExpressionAttributeNames['#price'] = 'price';
    }
    
    if (availableFrom) {
      filterExpressions.push('#availableFrom <= :availableFrom');
      params.ExpressionAttributeNames['#availableFrom'] = 'availableFrom';
      params.ExpressionAttributeValues[':availableFrom'] = availableFrom;
    }
    
    if (availableTo) {
      filterExpressions.push('#availableTo >= :availableTo');
      params.ExpressionAttributeNames['#availableTo'] = 'availableTo';
      params.ExpressionAttributeValues[':availableTo'] = availableTo;
    }
    
    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
    }
    
    // Add pagination
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    
    // Sort by creation date (newest first)
    params.ScanIndexForward = false;
    
    const result = await dynamodb.query(params).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        listings: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey,
        count: result.Count
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 