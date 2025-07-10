const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body);
    
    const { fileName, fileType } = body;
    
    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ message: 'fileName and fileType are required' })
      };
    }
    
    // Generate unique file key
    const fileKey = `uploads/${userId}/${Date.now()}-${fileName}`;
    
    const params = {
      Bucket: process.env.STORAGE_BUCKET,
      Key: fileKey,
      ContentType: fileType,
      Expires: 3600, // 1 hour
      Metadata: {
        userId: userId,
        originalName: fileName
      }
    };
    
    const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        presignedUrl,
        fileKey,
        fileName
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