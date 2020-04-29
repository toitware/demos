# Copyright (C) 2020 Toitware ApS. All rights reserved.

install:
	pip install -r server/requirements.txt

TOIT_API_PATH := ../third_party/toit_api/proto
PROTO_OUT_PATH := server

PROTO_FILES := $(shell find $(TOIT_API_PATH) -name '*.proto')
PYTHON_PROTO_TARGETS := $(PROTO_FILES:$(TOIT_API_PATH)/%.proto=$(PROTO_OUT_PATH)/%_pb2.py)

$(PROTO_OUT_PATH)/%_pb2.py: $(TOIT_API_PATH)/%.proto
	python -m grpc_tools.protoc --include_imports -I$(TOIT_API_PATH) --python_out=$(PROTO_OUT_PATH) --grpc_python_out=$(PROTO_OUT_PATH) $<

protobuf: $(PYTHON_PROTO_TARGETS)

clean:
	rm -rf $(PYTHON_PROTO_TARGETS)

run: $(PYTHON_PROTO_TARGETS)
	(cd server/ && python ./main.py)

image: $(PYTHON_PROTO_TARGETS)
	(cd server/ && docker build -t track-devices-app .)
	docker tag track-devices-app:latest gcr.io/sample-projects-270912/track-devices:latest

publish: image
	docker push gcr.io/sample-projects-270912/track-devices:latest
