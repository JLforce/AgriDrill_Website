import "dotenv/config";
import mqtt from "mqtt";

const HIVEMQ_HOST = process.env.HIVEMQ_HOST;
const HIVEMQ_PORT = Number(process.env.HIVEMQ_PORT || 8883);
const HIVEMQ_USERNAME = process.env.HIVEMQ_USERNAME;
const HIVEMQ_PASSWORD = process.env.HIVEMQ_PASSWORD;

if (
  !HIVEMQ_HOST ||
  !HIVEMQ_USERNAME ||
  !HIVEMQ_PASSWORD
) {
  console.error("Missing HiveMQ environment variables.");
  process.exit(1);
}

const client = mqtt.connect(
  `mqtts://${HIVEMQ_HOST}:${HIVEMQ_PORT}`,
  {
    username: HIVEMQ_USERNAME,
    password: HIVEMQ_PASSWORD,
    protocol: "mqtts",
    rejectUnauthorized: true,
  }
);

client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud.");
  console.log("Publishing test machine status...");

  client.publish(
    "agridrill/status",
    "DRILL DOWN",
    { qos: 0 },
    (error) => {
      if (error) {
        console.error("Publish failed:", error);
        client.end();
        return;
      }

      console.log("Test machine status published.");
      client.end();
    }
  );
});

client.on("error", (error) => {
  console.error("MQTT error:", error);
  client.end();
});