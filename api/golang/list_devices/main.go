package main

import (
	"context"
	"crypto/x509"
	"fmt"
	"os"
	"time"

	"github.com/toitware/api/golang/toit/api"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/keepalive"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("must be called with a <api-key> as argument")
		return
	}

	ctx := context.Background()

	apiKey := os.Args[1]

	conn, err := connect(ctx, apiKey)
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	devices, err := listDevices(ctx, conn)
	if err != nil {
		panic(err)
	}

	for _, device := range devices {
		fmt.Println(device.GetConfig().GetName())
	}
}

func listDevices(ctx context.Context, conn grpc.ClientConnInterface) ([]*api.Device, error) {
	client := api.NewDeviceServiceClient(conn)
	resp, err := client.ListDevices(ctx, &api.ListDevicesRequest{})
	if err != nil {
		return nil, err
	}
	return resp.GetDevices(), nil
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
