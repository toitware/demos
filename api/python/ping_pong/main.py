#!/usr/bin/env python

# Copyright (C) 2020 Toitware ApS. All rights reserved.

import grpc
import multiprocessing
import socket
import os
import sys
import signal
from toit.api import auth_pb2_grpc, auth_pb2
from toit.api.pubsub import subscribe_pb2, subscribe_pb2_grpc, publish_pb2, publish_pb2_grpc

INCOMING_TOPIC = "cloud:demo/pong"
OUTGOING_TOPIC = "cloud:demo/ping"


def create_channel(access_token=None):
  credentials = grpc.ssl_channel_credentials()
  if access_token is not None:
      credentials = grpc.composite_channel_credentials(credentials,
          grpc.access_token_call_credentials(access_token))

  return grpc.secure_channel("api.toit.io:443", credentials)

def create_subscription(subscription):
    return subscribe_pb2.Subscription(name=subscription,topic=INCOMING_TOPIC)

def setup_channel(accessToken):
    return create_channel(access_token=accessToken)

def get_messages(channel, subscription):
    while True:
        sub_stub = subscribe_pb2_grpc.SubscribeStub(channel)
        stream = sub_stub.Stream(subscribe_pb2.StreamRequest(subscription=subscription))

        try:
            for d in stream:
                for message in d.messages:
                    yield message
        except grpc.RpcError as rpc_error:
            if rpc_error.code() == grpc.StatusCode.UNAUTHENTICATED:
                raise rpc_error

def ack_message(channel, subscription, item):
    sub_stub = subscribe_pb2_grpc.SubscribeStub(channel)
    sub_stub.Acknowledge(subscribe_pb2.AcknowledgeRequest(subscription=subscription,envelope_ids=[item.id]))

def publish_message(channel, msg):
    pub_stub = publish_pb2_grpc.PublishStub(channel)
    pub_stub.Publish(publish_pb2.PublishRequest(topic=OUTGOING_TOPIC,publisher_name=socket.gethostname(),data=[msg.encode("utf-8")]))

class Subscribe(multiprocessing.Process):
    def __init__(self, accessToken, subscription):
        multiprocessing.Process.__init__(self)
        self.exit = multiprocessing.Event()
        self.accessToken = accessToken
        self.subscription = create_subscription(subscription)

    def run(self):
        channel = setup_channel(self.accessToken)
        try:
            while True:
                try:
                    for msg in get_messages(channel, self.subscription):
                        print("received: '"+ msg.message.data.decode("utf-8") + "'")
                        ack_message(channel, self.subscription, msg)
                except grpc.RpcError as rpc_error:
                    if rpc_error.code() == grpc.StatusCode.UNAUTHENTICATED:
                        self.channel = setup_channel(self.accessToken)
                    else:
                        raise rpc_error
        except KeyboardInterrupt:
            pass
        finally:
            channel.close()

def main():
    subscription = ""
    if sys.argv[1:]:
        subscription = sys.argv[1]
    else:
        print("You must provide the subscription name as argument")
        sys.exit()

    accessToken = input("Enter API-key secret:")    

    original_sigint_handler = signal.signal(signal.SIGINT, signal.SIG_IGN)
    signal.signal(signal.SIGINT, original_sigint_handler)

    subscribeProcess = Subscribe(accessToken=accessToken, subscription=subscription)
    subscribeProcess.start()

    channel = setup_channel(accessToken)
    try:
        print("Write a message to send:")
        while True:
            line = sys.stdin.readline().strip()
            print("sending: '" + line+ "'")
            publish_message(channel, line)
    except KeyboardInterrupt:
        pass
    finally:
        subscribeProcess.terminate()
        subscribeProcess.join()
        channel.close()
if __name__ == '__main__':
    main()
