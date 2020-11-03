
// Copyright (C) 2020 Toitware ApS. All rights reserved.
package io.toit.example;

public class Main {
  public static void main(final String[] args) throws Exception {
		Client client = new Client(args[0], args[1]);
    client.ListDevices().forEach((device) -> System.out.println(device.getConfig().getName()));
  }
}
