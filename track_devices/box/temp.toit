// Copyright (C) 2020 Toitware ApS. All rights reserved.

import data
import encoding.ubjson as ubjson
import peripherals show read_temperature read_humidity read_pressure

main:
  thp := {
    "t": read_temperature,
    "h": read_humidity,
    "p": read_pressure,
  }
  data.push "track_devices.thp" (ubjson.encode thp)
  log "[thp] data pushed"
