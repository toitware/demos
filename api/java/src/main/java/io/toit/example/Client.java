// Copyright (C) 2020 Toitware ApS. All rights reserved.
package io.toit.example;

import java.util.*;
import java.util.List;

import javax.net.ssl.SSLException;

import io.grpc.*;
import io.grpc.netty.*;
import io.netty.handler.ssl.*;
import io.toit.proto.toit.api.*;

public class Client {
  public static final String host = "api.toit.io";
  public static final int port = 443;

  static final SslContextBuilder builder = GrpcSslContexts.forClient();

  private final String username;
  private final String password;
  private ManagedChannel channel;
  private AuthCredentials credentials;

  public Client(String username, String password, ManagedChannel channel) {
    this.username = username;
    this.password = password;
    this.channel = channel;
  }

  public Client(String username, String password) throws SSLException {
    this.username = username;
    this.password = password;
    this.channel = CreateChannel();
  }

  public void Authenticate() {
    AuthGrpc.AuthBlockingStub client = AuthGrpc.newBlockingStub(channel);

    AuthProto.LoginRequest req = AuthProto.LoginRequest.newBuilder()
      .setUsername(username)
      .setPassword(password)
      .build();
    credentials = new AuthCredentials(client.login(req));
  }

  public List<DeviceProto.Device> ListDevices() {
    if (credentials == null) {
      Authenticate();
    }

    DeviceServiceGrpc.DeviceServiceBlockingStub client = DeviceServiceGrpc
      .newBlockingStub(channel)
      .withCallCredentials(credentials);

    DeviceProto.ListDevicesRequest req = DeviceProto.ListDevicesRequest.newBuilder()
      .build();

    DeviceProto.ListDevicesResponse resp = client.listDevices(req);
    return resp.getDevicesList();
  }

  public static ManagedChannel CreateChannel() throws SSLException  {
    return CreateChannel(host, port);
  }

  public static ManagedChannel CreateChannel(String host, int port) throws SSLException {
    return NettyChannelBuilder.forAddress(host, port).sslContext(builder.build()).build();
  }

}
