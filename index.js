const {
  IoTDataPlaneClient,
  PublishCommand,
} = require("@aws-sdk/client-iot-data-plane");
const { TOPICS } = require("./src/topics");
require("dotenv").config();
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const client = new IoTDataPlaneClient({ region: process.env.NODE_AWS_REGION });

exports.handler = async (event) => {
  console.log("EVENT RECEIVED:", event);
  const { eventType, connectionId, domainName, stage } =
    event?.requestContext ?? {};
  if (eventType && eventType === "CONNECT") {
    const command = new PublishCommand({
      topic: TOPICS.AWS_TO_ESP32,
      qos: 1,
      payload: Buffer.from(
        JSON.stringify({
          message: { data: { connectionState: 1, connectionId } },
        })
      ),
    });
    await client.send(command);
    console.log("Message published!");
  } else if (eventType && eventType === "DISCONNECT") {
    const command = new PublishCommand({
      topic: TOPICS.AWS_TO_ESP32,
      qos: 1,
      payload: Buffer.from(
        JSON.stringify({ message: { data: { connectionState: 0 } } })
      ),
    });
    await client.send(command);
    console.log("Message published!");
  }
  if (eventType && eventType === "MESSAGE") {
    const body = JSON.parse(event.body);
    console.log("BODY:", body);
    if (body?.topic === TOPICS.AWS_TO_ESP32) {
      const command = new PublishCommand({
        topic: TOPICS.AWS_TO_ESP32,
        qos: 1,
        payload: Buffer.from(
          JSON.stringify({
            message: { data: { motorState: body?.motorState } },
          })
        ),
      });
      await client.send(command);
      console.log("Message published!");
    }
  }
  if (event?.topic === TOPICS.ESP32_TO_AWS) {
    console.log(event);
    console.log("Message received!");
    const client = new ApiGatewayManagementApiClient({
      endpoint:
        "https://s12j6x8bii.execute-api.eu-west-2.amazonaws.com/production",
    });

    try {
      await client.send(
        new PostToConnectionCommand({
          ConnectionId: event.data.connectionId,
          Data: Buffer.from(JSON.stringify(event)),
        })
      );
      console.log("Message sent to connection:", connectionId);
    } catch (err) {
      if (err.name === "GoneException") {
        console.log("Connection is gone, clean up connectionId:", connectionId);
      } else {
        console.error("Error sending message:", err);
      }
    }
  }

  return { statusCode: 200 };
};
