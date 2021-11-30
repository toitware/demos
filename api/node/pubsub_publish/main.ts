// Copyright (C) 2021 Toitware ApS. All rights reserved.

import * as grpc from "@grpc/grpc-js"
import { AuthClient } from "@toit/api/src/toit/api/auth_grpc_pb"
import { AuthResponse, LoginRequest } from "@toit/api/src/toit/api/auth_pb"
import { PublishClient } from "@toit/api/src/toit/api/pubsub/publish_grpc_pb"
import { Device, ListDevicesRequest, ListDevicesResponse } from "@toit/api/src/toit/api/device_pb"
import { PublishRequest } from "@toit/api/src/toit/api/pubsub/publish_pb";
import * as os from "os";

const target = "api.toit.io"

async function main() {
  const apiToken = process.env.TOIT_API_KEY;
  if (apiToken === undefined) {
      console.error("must be called with TOIT_API_KEY set");
      return;
  }

  const credentials = createCredentials(apiToken)
  const [_, __, topic, ...messages] = process.argv
  const message = messages.join(" ")
  console.log("published '"+message+"' on topic: '"+topic+"'");
  await publishMessage(credentials, topic, message);
}

function createCredentials(apiToken: string): grpc.ChannelCredentials {
    return grpc.credentials.combineChannelCredentials(
        grpc.credentials.createSsl(),
        grpc.credentials.createFromMetadataGenerator((_, cb) => {
            const md = new grpc.Metadata();
            md.set("Authorization", "Bearer " + apiToken);
            cb(null, md);
        }),
    );
}

function publishMessage(credentials: grpc.ChannelCredentials,topic:string, message:string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const client = new PublishClient(target, credentials)
        const req = new PublishRequest();
        req.setTopic(topic);
        req.setPublisherName(os.hostname());
        req.setDataList([Buffer.from(message).toString("base64")]);
        client.publish(req, (err, resp) => {
            if (err !== null) {
                reject(err)
            } else {
                resolve();
            }
        })
    })
}

main();
