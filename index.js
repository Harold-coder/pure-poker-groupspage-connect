const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const connectionsTableName = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;

    // Optionally retrieve groupId and userId from queryStringParameters
    const groupId = event.queryStringParameters ? event.queryStringParameters.groupId : null;
    const userId = event.queryStringParameters ? event.queryStringParameters.userId : null;

    // Note: userId = jwtToken
    if (!userId) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to connect, no jwt given.', action: 'groups-connect' }) };
    }

    let playerId = undefined;
    try {
        const res = await fetch(
          //error 500
          "https://oqqznkdgb3.execute-api.us-east-1.amazonaws.com/dev/validate_token",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${userId}`,
            },
          }
        );
        console.log("Response:", res);
        if (res.status === 200) {
          const data = await res.json();
          playerId = data.user.username;
        } else {
          return {
            statusCode: 500,
            body: JSON.stringify({
              message: "Failed to validate token",
              action: "groups-connect",
            }),
            headers: headerTemplate,
          };
        }
      } catch (err) {
        console.error("Error validating token:", err);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Failed to validate token",
            action: "groups-connect",
          }),
          headers: headerTemplate,
        };
      }

    const item = {
        connectionId: connectionId,
        // Only add groupId and userId to the item if they are provided
        ...(groupId && { groupId: groupId }),
        ...(playerId && { userId: playerId }),
    };

    try {
        await dynamoDb.put({ TableName: connectionsTableName, Item: item }).promise();
        return { statusCode: 200, body: JSON.stringify({ message: 'Connected.', action: 'connect' }) };
    } catch (err) {
        console.error('Error:', err);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to connect', action: 'connect' }) };
    }
};