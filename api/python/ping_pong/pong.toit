import pubsub

INCOMING_TOPIC ::= "cloud:demo/ping"
OUTGOING_TOPIC ::= "cloud:demo/pong"

main:
  pubsub.subscribe INCOMING_TOPIC --auto_acknowledge: | msg/pubsub.Message |
    print "received: $msg.payload.to_string"
    pubsub.publish OUTGOING_TOPIC msg.payload
