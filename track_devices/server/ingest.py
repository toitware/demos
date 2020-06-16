# Copyright (C) 2020 Toitware ApS. All rights reserved.

import time
import grpc
import uuid
import ubjson
import os
from device_store import Location, create_device_store

from toit.model import data_pb2 as toit_model_data
from toit.api import auth_pb2_grpc, auth_pb2, data_pb2_grpc, data_pb2
from google.protobuf import timestamp_pb2


def create_channel(access_token=None):
    cert_file = os.getenv("CERT_FILE", os.path.dirname(os.path.realpath(__file__))+ "/GlobalSign_Root_CA_R2.cert")
    print("loading cert file: ", cert_file)
    with open(cert_file, 'rb') as f:
        trusted_certs = f.read()
    credentials = grpc.ssl_channel_credentials(root_certificates=trusted_certs)
    if access_token is not None:
        credentials = grpc.composite_channel_credentials(credentials,
            grpc.access_token_call_credentials(access_token))

    return grpc.secure_channel("api.toit.io:443", credentials)

def setup_channel(config):
    channel = create_channel()
    try:
        auth = auth_pb2_grpc.AuthStub(channel)
        resp = auth.Login(auth_pb2.LoginRequest(username=config['toit']['username'],password=config['toit']['password']))
        return create_channel(access_token=str(resp.access_token, 'utf-8'))
    finally:
        channel.close()

def create_subscription(config):
    return data_pb2.Subscription(type=data_pb2.TOPIC_DATA,name=config['toit']['data_topic_subscription'])

def get_messages(channel, subscription):
    while True:
        data_stub = data_pb2_grpc.DataServiceStub(channel)
        stream = data_stub.Stream(data_pb2.StreamRequest(subscription=subscription))

        try:
            for d in stream:
                for message in d.messages:
                    yield message
        except grpc.RpcError as rpc_error:
            print("got RPC error", rpc_error.code(), rpc_error.details())
            if rpc_error.code() == grpc.StatusCode.UNAUTHENTICATED:
                raise rpc_error


def ack_message(channel, sub, item):
    data_stub = data_pb2_grpc.DataServiceStub(channel)
    data_stub.Acknowledge(data_pb2.AcknowledgeRequest(subscription=sub,message_ids=[item.id]))

def is_number(n):
    return isinstance(n, (int, float, complex)) and not isinstance(n, bool)

def is_location(loc):
    return len(loc) == 2 and is_number(loc[0]) and is_number(loc[1])

def persist_location(store, device_id, created_at, data):
    loc = ubjson.loadb(data)
    if not is_location(loc):
        print("received invalid location: ", loc)
        return

    store.write_location(device_id, created_at, Location(loc[0], loc[1]))

def is_thp(thp):
    return is_number(thp['t']) and is_number(thp['h']) and is_number(thp['p'])

def persist_thp(store, device_id, created_at, data):
    thp = ubjson.loadb(data)
    if not is_thp(thp):
        print("received invalid thp", thp)
        return

    store.write_thp(device_id, created_at, thp['t'],thp['h'],thp['p'])

def is_alert(alert):
    return isinstance(alert['message'], str)

def persist_alert(store, device_id, created_at, data):
    alert = ubjson.loadb(data)
    if not is_alert(alert):
        print("received invalid alert", alert)
        return

    store.write_alert(device_id, created_at, alert["message"], 0)

def persist_message(store, msg):
    if msg.type != data_pb2.TOPIC_DATA:
        return

    # Ignore parse errors
    try:
        device_id = uuid.UUID(bytes=msg.device_id)
        created_at = msg.created.ToDatetime()
        topic_data = toit_model_data.TopicData()
        topic_data.ParseFromString(msg.data)
    except Exception as e:
        print("Failed to parse message", e, "message", msg)
        return

    print("got message: ", topic_data.topic)
    if topic_data.topic == "track_devices.location":
        persist_location(store, device_id, created_at, topic_data.data)
    elif topic_data.topic == "track_devices.thp":
        persist_thp(store, device_id, created_at, topic_data.data)
    elif topic_data.topic == "track_devices.alert":
        persist_alert(store, device_id, created_at, topic_data.data)
    else:
        print("Ignoring message ontopic:", topic_data.topic)


def main(config):
    print("setup ingest process")

    if os.environ.get('https_proxy'):
        del os.environ['https_proxy']
    if os.environ.get('http_proxy'):
        del os.environ['http_proxy']

    channel = setup_channel(config)
    sub = create_subscription(config)
    store = create_device_store(config)

    try:
        while True:
            try:
                for msg in get_messages(channel, sub):
                    persist_message(store, msg.message)
                    ack_message(channel, sub, msg)
            except grpc.RpcError as rpc_error:
                if rpc_error.code() == grpc.StatusCode.UNAUTHENTICATED:
                    channel = setup_channel(config)
                else:
                    raise rpc_error
    finally:
        store.close()
        channel.close()
