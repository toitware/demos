package main

import (
	"context"
	"crypto/x509"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/toitware/api/golang/toit/api/pubsub"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
)

const (
	ToitAPIKeyEnv = "TOIT_API_KEY"
)

func main() {
	if len(os.Args) != 3 {
		fmt.Println("must be called with a <topic> <subscription-name> as argument")
		os.Exit(1)
		return
	}

	apiKey, ok := os.LookupEnv(ToitAPIKeyEnv)
	if !ok {
		fmt.Println(ToitAPIKeyEnv, "environment variable must be set with the api key to use")
		os.Exit(1)
		return
	}

	ctx := context.Background()

	conn, err := connect(ctx, apiKey)
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	if err := readPubSub(ctx, os.Args[0], os.Args[1], conn); err != nil {
		panic(err)
	}
}

func readPubSub(ctx context.Context, topic string, name string, conn grpc.ClientConnInterface) error {
	client := pubsub.NewSubscribeClient(conn)

	for {
		stream, err := client.Stream(ctx, &pubsub.StreamRequest{
			Subscription: &pubsub.Subscription{
				Topic: topic,
				Name:  name,
			},
		})
		if err != nil && !isRetryableError(err) {
			return err
		}

		for {
			resp, err := stream.Recv()
			if err == io.EOF {
				break
			} else if err != nil && !isRetryableError(err) {
				return err
			}

			var ids [][]byte
			for _, msg := range resp.GetMessages() {
				fmt.Println("Got data: ", string(msg.GetMessage().GetData()))
				ids = append(ids, msg.GetId())
			}

			client.Acknowledge(ctx, &pubsub.AcknowledgeRequest{
				Subscription: &pubsub.Subscription{
					Topic: topic,
					Name:  name,
				},
				EnvelopeIds: ids,
			})
		}

	}

}

func connect(ctx context.Context, apiKey string) (*grpc.ClientConn, error) {
	pool, err := x509.SystemCertPool()
	if err != nil {
		return nil, err
	}
	return grpc.DialContext(ctx, "api.toit.io:443",
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:    5 * time.Second,
			Timeout: 2 * time.Second,
		}),
		grpc.WithTransportCredentials(credentials.NewClientTLSFromCert(pool, "")),
		grpc.WithPerRPCCredentials(newAPIRPCCredentials(apiKey)),
	)
}

type apiRPCCredentials struct {
	apiKey string
}

func newAPIRPCCredentials(apiKey string) *apiRPCCredentials {
	return &apiRPCCredentials{
		apiKey: apiKey,
	}
}

func (c *apiRPCCredentials) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
	return map[string]string{
		"Authorization": "Bearer " + c.apiKey,
	}, nil
}

func (c *apiRPCCredentials) RequireTransportSecurity() bool {
	return true
}

func isRetryableError(err error) bool {
	s, ok := status.FromError(err)
	if !ok {
		return false
	}

	switch s.Code() {
	case codes.InvalidArgument,
		codes.NotFound,
		codes.AlreadyExists,
		codes.PermissionDenied,
		codes.FailedPrecondition,
		codes.Aborted,
		codes.OutOfRange,
		codes.Unimplemented,
		codes.DataLoss,
		codes.Unauthenticated:
		return false
	}
	return true
}
