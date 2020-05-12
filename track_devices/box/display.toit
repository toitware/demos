// Copyright (C) 2020 Toitware ApS. All rights reserved.

import texture show *
import two_color show InfiniteBackground WHITE BLACK TextTexture
import pixel_display show TwoColorPixelDisplay
import peripherals show *
import device

import font
import font.x11_100dpi.sans.sans_10 as sans_10_roman
import font.x11_100dpi.sans.sans_24_bold as sans_24_bold

sans_10 ::= font.Font.from_pages [sans_10_roman.ASCII]
sans_24 ::= font.Font.from_pages [sans_24_bold.ASCII, sans_24_bold.LATIN_1_SUPPLEMENT]
display ::= TwoColorPixelDisplay "eink"

main:
  // Get the environmental data.
  temperature := read_temperature
  humidity    := read_humidity
  pressure    := read_pressure / 100 // Convert to hPa.

  // Draw text on the display.
  display.add
    TextTexture 112 15 display.landscape TEXT_TEXTURE_ALIGN_CENTER "$device.name" sans_10 BLACK
  display.add
    TextTexture 116 45 display.landscape TEXT_TEXTURE_ALIGN_CENTER "$(%.1f temperature)°C, $(%.0f humidity)%" sans_24 BLACK
  display.add
    TextTexture 112 80 display.landscape TEXT_TEXTURE_ALIGN_CENTER "$(%.1f pressure)" sans_24 BLACK
  time := Time.now.to_time_info
  display.add
    TextTexture 205 100 display.landscape TEXT_TEXTURE_ALIGN_RIGHT "$(%02d time.hours):$(%02d time.minutes) $(%02d time.day)/$(%02d time.month + 1)" sans_10 BLACK
  display.draw --speed=0
