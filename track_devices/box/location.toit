// Copyright (C) 2020 Toitware ApS. All rights reserved.

import data
import job

import encoding.ubjson as ubjson
import location show Location
import gnss_location show GnssLocation
import peripherals show GPS

main:
  trigger ::= job.trigger
  moved ::= trigger is job.MovementTrigger
  reason ::= moved ? "because of movement" : "as scheduled"

  log "[location] started $reason"
  gps := GPS.start
  try:
    if moved:
      track_movement gps
    else:
      get_stationary_fix gps
  finally:
    gps.close

get_stationary_fix gps/GPS:
  start ::= Time.now
  location := null
  while not location and (Time.now - start) < (Duration --minutes=10):
    location = gps.read
    sleep --ms=1000

  if location:
    spent ::= Time.now - start
    log "[location] first fix took $spent: $(format_location location)"

    // Keep improving the GPS fix for a little while longer, up to
    // two minutes in total, but at least 20 seconds.
    left ::= (Duration --minutes=3) - spent
    sleep (max (Duration --seconds=20) left)
    location = gps.read
    log "[location] improved fix took $(Time.now - start): $(format_location location)"
    push_location location

track_movement gps/GPS:
  start ::= Time.now
  has_fix := false
  while (Time.now - start) < (Duration --minutes=20):
    location := gps.read
    if not location:
      sleep --ms=1000
      continue
    spent ::= Time.now - start
    if not has_fix:
      log "[location] first fix took $spent: $(format_location location)"
      has_fix = true
    else:
      log "[location] updated fix after $spent: $(format_location location)"
    // TODO(kasper): Maybe only push new locations if they have changed?
    push_location location
    sleep --ms=60_000

format_location location/GnssLocation -> string:
  return "$location (±$(%.1f location.horizontal_accuracy)m)"

push_location location/GnssLocation:
  // TODO(kasper): We turn the GnssLocation into a plain old Location
  // before we serialize it because the server-side cannot deal with
  // the additional fields just yet.
  plain_location := Location location.latitude location.longitude
  data.push "track_devices.location" plain_location.to_byte_array
  log "[location] pushed"
