# PubSub-Publish

C-Sharp example, showing how to publish a message to a device from C#.
The example, works together with the Pubsub Toit device example found here:

https://github.com/toitware/examples/blob/main/communication/pubsub/subscribe_cloud.toit

To run the example, you need to replace the '\<apikey\>' in line 10 with a real API-Key

```
private static string apikey = "<apikey>";
```

The key can be created from here:

https://console.toit.io/project/apikeys

# PubSub-Subscribe

C-Sharp example, showing how to subscribe to a topic, and receive a message from a device in C#.
The example, works together with the Pubsub Toit device example found here:

https://github.com/toitware/examples/blob/main/communication/pubsub/publish_cloud.toit

To run the example, you need to replace the '\<apikey\>' in line 10 with a real API-Key

```
private static string apikey = "<apikey>";
```

The key can be created from here:

https://console.toit.io/project/apikeys


The subscriber will create a subscription called 'csharp' on the 'cloud:hello-world' topic, to remove this subscription again, run the following cli-command:
```
toit pubsub subscription remove cloud:hello-world csharp
```