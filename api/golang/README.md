# Toit API golang example

Will list all devices in a project.

First, we'll need an API key. Use `toit project api-keys add <api-key-name>` to create one.

View the API key *secret* with `toit project api-keys print-secret <api-key-id>`

To run, use:
```
$ go run ./main.go <api-key-secret>
```
