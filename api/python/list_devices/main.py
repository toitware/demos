#!/usr/bin/env python

# Copyright (C) 2020 Toitware ApS. All rights reserved.

import grpc
import os
import sys
from toit.api import auth_pb2_grpc, auth_pb2, device_pb2_grpc, device_pb2

def create_channel(access_token=None):
  credentials = grpc.ssl_channel_credentials()
  if access_token is not None:
      credentials = grpc.composite_channel_credentials(credentials,
          grpc.access_token_call_credentials(access_token))

  return grpc.secure_channel("api.toit.io:443", credentials)

def setup_channel(username, password):
  channel = create_channel()
  try:
      auth = auth_pb2_grpc.AuthStub(channel)
      resp = auth.Login(auth_pb2.LoginRequest(username=username,password=password))
      return create_channel(access_token=str(resp.access_token, 'utf-8'))
  finally:
      channel.close()

def list_devices(channel):
  device = device_pb2_grpc.DeviceServiceStub(channel)
  resp = device.ListDevices(device_pb2.ListDevicesRequest())
  for device in resp.devices:
      print(device.config.name)

def main():
    channel = setup_channel(sys.argv[1], sys.argv[2])
    try:
      list_devices(channel)
    finally:
      channel.close()

if __name__ == '__main__':
    main()
