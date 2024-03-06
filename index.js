const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const connectionsTableName = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;

    // Optionally retrieve groupId and userId from queryStringParameters
    const groupId = event.queryStringParameters ? event.queryStringParameters.groupId : null;
    const userId = event.queryStringParameters ? event.queryStringParameters.userId : null;

    const item = {
        connectionId: connectionId,
        // Only add groupId and userId to the item if they are provided
        ...(groupId && { groupId: groupId }),
        ...(userId && { userId: userId }),
    };

    try {
        await dynamoDb.put({ TableName: connectionsTableName, Item: item }).promise();
        return { statusCode: 200, body: JSON.stringify({ message: 'Connected.', action: 'connect' }) };
    } catch (err) {
        console.error('Error:', err);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to connect', action: 'connect' }) };
    }
};