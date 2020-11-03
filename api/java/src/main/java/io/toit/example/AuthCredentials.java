// Copyright (C) 2020 Toitware ApS. All rights reserved.
package io.toit.example;

import java.util.concurrent.Executor;
import io.grpc.*;
import io.grpc.Metadata.Key;
import io.toit.proto.toit.api.AuthProto;

import com.google.protobuf.ByteString;
import com.google.protobuf.Duration;

public class AuthCredentials extends CallCredentials {
  private ByteString accessToken;
  private String tokenType;
  private ByteString refreshToken;
  private Duration expiresIn;

  public AuthCredentials(ByteString accessToken, String tokenType, ByteString refreshToken, Duration expiresIn) {
    this.accessToken = accessToken;
    this.tokenType = tokenType;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
  }

  public AuthCredentials(AuthProto.AuthResponse auth) {
    this.accessToken = auth.getAccessToken();
    this.tokenType = auth.getTokenType();
    this.refreshToken = auth.getRefreshToken();
    this.expiresIn = auth.getExpiresIn();
  }

  @Override
  public void applyRequestMetadata(RequestInfo requestInfo, Executor executor,
          MetadataApplier metadataApplier) {
  	executor.execute(new Runnable() {
      @Override
      public void run() {
        try {
          Metadata headers = new Metadata();
          Key<String> tokenKey = Metadata.Key.of("ToitAccessToken", Metadata.ASCII_STRING_MARSHALLER);
          headers.put(tokenKey, accessToken.toStringUtf8());
          metadataApplier.apply(headers);
        } catch (Throwable e) {
          metadataApplier.fail(Status.UNAUTHENTICATED.withCause(e));
        }
      }
    });
  }

  @Override public void thisUsesUnstableApi() {
  }
}
