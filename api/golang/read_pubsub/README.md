# Read pubsub

Will read pubsub from a given topic and print it on stdout.

First, we'll need an API key. Use `toit project api-keys add <api-key-name>` to create one.

View the API key *secret* with `toit project api-keys print-secret <api-key-id>`

Next create a subscription with `toit pubsub subscription create <topic> <subscription-name>`.

To run, use:
```
$ TOIT_API_KEY=<api-key-secret> go run ./main.go <topic> <subscription-name>
```
