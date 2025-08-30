import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import 'dotenv/config';

const client = new IoTDataPlaneClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {

  if(event?.topic === process.env.AWS_IOT_TOPIC){
      const command = new PublishCommand({
      topic: process.env.AWS_IOT_TOPIC,
      qos: 1,
      payload: Buffer.from(JSON.stringify({ message: {data:{motorState:event.motorState}}}))
    });

    await client.send(command);
    console.log("Message published!");
  }

};