const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body);
    const { conversationId, message, recipientId } = body;
    
    if (!message) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ message: 'Message content is required' })
      };
    }
    
    const timestamp = new Date().toISOString();
    const messageId = uuidv4();
    
    // If no conversationId, create a new conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      if (!recipientId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
          },
          body: JSON.stringify({ message: 'Recipient ID is required for new conversations' })
        };
      }
      
      currentConversationId = uuidv4();
      
      // Create conversation record
      const conversation = {
        id: currentConversationId,
        participants: [userId, recipientId],
        createdAt: timestamp,
        updatedAt: timestamp,
        lastMessage: message,
        lastMessageTime: timestamp
      };
      
      await dynamodb.put({
        TableName: process.env.CONVERSATIONS_TABLE,
        Item: conversation
      }).promise();
    }
    
    // Create message record
    const messageRecord = {
      conversationId: currentConversationId,
      timestamp: timestamp,
      messageId: messageId,
      senderId: userId,
      content: message,
      createdAt: timestamp
    };
    
    await dynamodb.put({
      TableName: process.env.MESSAGES_TABLE,
      Item: messageRecord
    }).promise();
    
    // Update conversation with last message
    await dynamodb.update({
      TableName: process.env.CONVERSATIONS_TABLE,
      Key: { id: currentConversationId },
      UpdateExpression: 'SET lastMessage = :lastMessage, lastMessageTime = :lastMessageTime, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':lastMessage': message,
        ':lastMessageTime': timestamp,
        ':updatedAt': timestamp
      }
    }).promise();
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        messageId: messageId,
        conversationId: currentConversationId,
        message: messageRecord
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