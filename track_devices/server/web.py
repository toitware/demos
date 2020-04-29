# Copyright (C) 2020 Toitware ApS. All rights reserved.

import time
import http.server
import socketserver
import uuid
import simplejson as json
from device_store import Device, Location, THP, create_device_store
from urllib.parse import urlparse
from http import HTTPStatus


WEB_PATH = ""
SERVE_PATH =""
DEVICE_STORE = None

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.store = DEVICE_STORE
        self.prefix_path = WEB_PATH
        super().__init__(*args, directory=SERVE_PATH, **kwargs)

    def list_devices(self):
        devices = self.store.list_devices()
        res = json.dumps([dev.map() for dev in devices])
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-type", "application/json")
        self.send_header("Content-Length", len(res))
        self.end_headers()
        self.wfile.write(str.encode(res))
        self.wfile.flush()
        return None

    def get_device(self, device_id):
        id = uuid.UUID(device_id)
        device = self.store.get_device(id)
        res = json.dumps(device.map())
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-type", "application/json")
        self.send_header("Content-Length", len(res))
        self.end_headers()
        self.wfile.write(str.encode(res))
        self.wfile.flush()
        return None

    def delete_device(self, device_id):
        id = uuid.UUID(device_id)
        self.store.delete_device(id)
        res = json.dumps({"deleted": True})
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-type", "application/json")
        self.send_header("Content-Length", len(res))
        self.end_headers()
        self.wfile.write(str.encode(res))
        self.wfile.flush()
        return None

    def do_DELETE(self):
        if self.path.startswith(self.prefix_path):
            self.path = self.path[len(self.prefix_path):]
            if not self.path.startswith("/"):
                self.path = "/" + self.path
        url = urlparse(self.path)
        if url.path.startswith("/api/devices/"):
            device = self.path[len("/api/devices/"):]
            print("requested single device", device)
            self.delete_device(device)

    def do_GET(self):
        if self.path.startswith(self.prefix_path):
            self.path = self.path[len(self.prefix_path):]
            if not self.path.startswith("/"):
                self.path = "/" + self.path
        url = urlparse(self.path)
        if url.path == "/api/devices":
            print("requested list of devices")
            self.list_devices()
        elif url.path.startswith("/api/devices/"):
            device = self.path[len("/api/devices/"):]
            print("requested single device", device)
            self.get_device(device)
        else:
            super(Handler, self).do_GET()

def main(config):
    print("Serving web")
    global SERVE_PATH
    SERVE_PATH = config['web']['serve_path']
    global WEB_PATH
    WEB_PATH = config['web']['path']
    store = create_device_store(config)
    global DEVICE_STORE
    DEVICE_STORE = store
    try:
        with socketserver.TCPServer(("", config['web']['port']), Handler) as httpd:
            print("Server started at localhost:" + str(config['web']['port']))
            httpd.serve_forever()
    finally:
        store.close()
