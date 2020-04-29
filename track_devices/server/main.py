#!/usr/bin/env python

# Copyright (C) 2020 Toitware ApS. All rights reserved.

import yaml
import multiprocessing
import ingest
import web
import os
import sys
import psutil

def killtree(pid, including_parent=True):
    parent = psutil.Process(pid)
    for child in parent.children(recursive=True):
        child.kill()

    if including_parent:
        parent.kill()

if __name__ == '__main__':
    config_file = os.getenv("CONFIG_FILE", os.path.dirname(os.path.realpath(__file__))+ "/config.yaml")
    print("loading config: ", config_file)


    with open(config_file, 'r') as stream:
        try:
            cfg = yaml.safe_load(stream)
        except yaml.YAMLError as exc:
            print(exc)

    if len(sys.argv) > 1:
        if sys.argv[1] == "ingest":
            ingest.main(cfg)
            exit()
        elif sys.argv[1] == "web":
            web.main(cfg)
            exit()

    try:
        ingestProcess = multiprocessing.Process(target=ingest.main, args=(cfg,))
        ingestProcess.daemon=True
        ingestProcess.start()
        webProcess = multiprocessing.Process(target=web.main, args=(cfg,))
        webProcess.daemon=True
        webProcess.start()

        ingestProcess.join()
        webProcess.join()
    finally:
        killtree(os.getpid())
