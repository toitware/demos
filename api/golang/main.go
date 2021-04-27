package main

import (
	"context"
	"crypto/x509"
	"fmt"
	"os"
	"time"

	"github.com/toitware/api/golang/toit/api"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/keepalive"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("must be called with a <api-key> as argument")
		return
	}

	ctx := context.Background()

	apiKey := os.Args[1]

	conn, err := connect(ctx, apiKey)
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	devices, err := listDevices(ctx, conn)
	if err != nil {
		panic(err)
	}

	for _, device := range devices {
		fmt.Println(device.GetConfig().GetName())
	}
}

func listDevices(ctx context.Context, conn grpc.ClientConnInterface) ([]*api.Device, error) {
	client := api.NewDeviceServiceClient(conn)
	resp, err := client.ListDevices(ctx, &api.ListDevicesRequest{})
	if err != nil {
		return nil, err
	}
	return resp.GetDevices(), nil
}

func connect(ctx context.Context, apiKey string) (*grpc.ClientConn, error) {
	pool, err := x509.SystemCertPool()
	if err != nil {
		return nil, err
	}
	return grpc.DialContext(ctx, "api.toit.io:443",
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:    5 * time.Second,
			Timeout: 2 * time.Second,
		}),
		grpc.WithTransportCredentials(credentials.NewClientTLSFromCert(pool, "")),
		grpc.WithPerRPCCredentials(newAPIRPCCredentials(apiKey)),
	)
}

type apiRPCCredentials struct {
	apiKey string
}

func newAPIRPCCredentials(apiKey string) *apiRPCCredentials {
	return &apiRPCCredentials{
		apiKey: apiKey,
	}
}

func (c *apiRPCCredentials) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
	return map[string]string{
		"Authorization": "Bearer " + c.apiKey,
	}, nil
}

func (c *apiRPCCredentials) RequireTransportSecurity() bool {
	return true
}

/**


// Copyright (C) 2020 Toitware ApS. All rights reserved.

import { LoginRequest, AuthResponse } from "@toitware/api/src/toit/api/auth_pb"
import { AuthClient } from "@toitware/api/src/toit/api/auth_grpc_pb"
import { ListDevicesRequest, ListDevicesResponse, Device } from "@toitware/api/src/toit/api/device_pb"
import { DeviceServiceClient } from "@toitware/api/src/toit/api/device_grpc_pb"
import * as grpc from "@grpc/grpc-js"

async function main() {
  if (process.argv.length != 4) {
    console.error("must be called with toitware <username> and <password> as arguments");
    return;
  }

  const credentials = grpc.credentials.createSsl();
  const auth = await login(credentials, process.argv[2], process.argv[3]);

  const channel = new grpc.Channel("api.toit.io",
    grpc.credentials.combineChannelCredentials(credentials,
      grpc.credentials.createFromMetadataGenerator((_, cb) => {
        const md = new grpc.Metadata();
        md.set("Authorization", "Bearer " + new Buffer(auth.getAccessToken_asU8()).toString("utf8"));
        cb(null, md);
      })), {});

  const devices = await listDevices(channel);
  devices.forEach((d: Device) => {
    console.log(d.getConfig().getName());
  });
}

function listDevices(channel: grpc.Channel): Promise<Array<Device>> {
  return new Promise<Array<Device>>((resolve, reject) => {
    const client = new DeviceServiceClient("", null, { channelOverride: channel });
    const request = new ListDevicesRequest();
    client.listDevices(request, function (err: Error | null, response?: ListDevicesResponse) {
      if (err) {
        reject(err);
      } else if (!response) {
        reject("Empty response was returned from list devices")
      } else {
        resolve(response.getDevicesList());
      };
    });
  });
}


function login(credentials: grpc.ChannelCredentials, username: string, password: string): Promise<AuthResponse> {
  return new Promise<AuthResponse>((resolve, reject) => {
    const channel = new grpc.Channel("api.toit.io", credentials, {});
    const client = new AuthClient("", null, { channelOverride: channel });
    const loginRequest = new LoginRequest();
    loginRequest.setUsername(username);
    loginRequest.setPassword(password);
    client.login(loginRequest, function (err: Error | null, response?: AuthResponse) {
      if (err) {
        reject(err);
      } else if (!response) {
        reject("Empty response was returned from login")
      } else {
        resolve(response);
      };
    });
  });
}


main();
**/
