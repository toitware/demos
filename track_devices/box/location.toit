// Copyright (C) 2020 Toitware ApS. All rights reserved.

import data
import encoding.ubjson as ubjson
import location show Location
import peripherals show GPS

main:
  log "[location] started"
  gps := GPS.start
  try:
    start ::= Time.now
    location := null
    while not location and (Time.now - start) < (Duration --minutes=10):
      location = gps.read
      sleep --ms=1000

    if location:
      spent ::= Time.now - start
      log "[location] first fix took $spent: $location"

      // Keep improving the GPS fix for a little while longer, up to
      // two minutes in total, but at least 20 seconds.
      left ::= (Duration --minutes=3) - spent
      sleep (max (Duration --seconds=20) left)
      location = gps.read
      log "[location] improved fix took $(Time.now - start): $location"

      // TODO(kasper): We turn the GnssLocation into a plain old Location
      // before we serialize it because the server-side cannot deal with
      // the additional fields just yet.
      plain_location := Location location.latitude location.longitude
      data.push "track_devices.location" plain_location.to_byte_array
      log "[location] pushed"

  finally:
    gps.close
