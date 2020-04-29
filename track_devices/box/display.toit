// Copyright (C) 2020 Toitware ApS. All rights reserved.

import font
import texture show *
import two_color show InfiniteBackground WHITE BLACK TextTexture
import pixel_display show TwoColorPixelDisplay
import peripherals show *
import device
sans ::= font.font_get "sans10"
sansb ::= font.font_get "numbers-sans24b"
display ::= TwoColorPixelDisplay "eink"
main:
  // Get the temperature.
  temperature := read_temperature
  humidity    := read_humidity
  pressure    := read_pressure
  pressure = pressure / 100 //to hPa
  led_names_init := ["TOP LEFT", "TOP RIGHT", "BOTTOM RIGHT", "BOTTOM LEFT"]
  led_names_init.do:
    led := Led it
    led.off
  led := Led "BOTTOM RIGHT"
  led.on
  // Draw text on the display.
  display.add
    TextTexture 112 15 display.landscape TEXT_TEXTURE_ALIGN_CENTER "$device.name" sans BLACK
  display.add
    TextTexture 116 45 display.landscape TEXT_TEXTURE_ALIGN_CENTER "$(%.1f temperature)°C, $(%.0f humidity)%" sansb BLACK
  display.add
    TextTexture 112 80 display.landscape TEXT_TEXTURE_ALIGN_CENTER "$(%.1f pressure)" sansb BLACK
  time := Time.now.to_time_info
  display.add
    TextTexture 205 100 display.landscape TEXT_TEXTURE_ALIGN_RIGHT "$(%02d time.hours):$(%02d time.minutes) $(%02d time.day)/$(%02d time.month + 1)" sans BLACK
  display.draw --speed=0
  led.off
