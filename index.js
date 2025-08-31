const { IoTDataPlaneClient, PublishCommand } = require("@aws-sdk/client-iot-data-plane");
const { TOPICS } = require("./src/topics");
require("dotenv").config();

const client = new IoTDataPlaneClient({ region: process.env.NODE_AWS_REGION });

exports.handler = async (event) => {
  console.log(event)
  event = Object.freeze(event);
  if(event?.topic === TOPICS.AWS_TO_ESP32){
      const command = new PublishCommand({
      topic: process.env.NODE_AWS_IOT_TOPIC,
      qos: 1,
      payload: Buffer.from(JSON.stringify({ message: {data:{motorState:event.motorState}}}))
    });
    await client.send(command);
    console.log("Message published!");
  } else if(event?.topic === TOPICS.ESP32_TO_AWS){
    console.log(event);
    console.log("Message received!");
  }

};