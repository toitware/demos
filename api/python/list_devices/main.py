#!/usr/bin/env python

# Copyright (C) 2020 Toitware ApS. All rights reserved.

import grpc
import os
import sys
import getpass
from toit.api import auth_pb2_grpc, auth_pb2, device_pb2_grpc, device_pb2

def create_channel(access_token=None):
  credentials = grpc.ssl_channel_credentials()
  if access_token is not None:
      credentials = grpc.composite_channel_credentials(credentials,
          grpc.access_token_call_credentials(access_token))

  return grpc.secure_channel("api.toit.io:443", credentials)

def setup_channel(accessToken):
  return create_channel(access_token=accessToken)

def list_devices(channel):
  device = device_pb2_grpc.DeviceServiceStub(channel)
  resp = device.ListDevices(device_pb2.ListDevicesRequest())
  print("Listing available devices in current project:")
  for device in resp.devices:
      print(device.config.name)

def main():
    accessToken = getpass.getpass("Enter API-key secret:")
    channel = setup_channel(accessToken)
    try:
      list_devices(channel)
    finally:
      channel.close()

if __name__ == '__main__':
    main()
