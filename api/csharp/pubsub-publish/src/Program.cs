using System.Threading.Tasks;
using Google.Protobuf;
using Grpc.Core;
using Grpc.Net.Client;

namespace toit.demos.api.csharp.pubsubpublish
{
    public class Program
    {
        private static string apikey = "<apikey>"; // From: https://console.toit.io/project/apikeys
        static async Task Main(string[] args)
        {
            var callCredentials = CallCredentials.FromInterceptor(async (context, metadata) =>
            {
                await Task.Delay(100);
                metadata.Add("Authorization", $"Bearer {apikey}");
            });
            var channelCredentials = ChannelCredentials.Create(new SslCredentials(), callCredentials);
            using var channel = GrpcChannel.ForAddress("https://api.toit.io:443", new GrpcChannelOptions
            {
                Credentials = channelCredentials
            });

            var client = new Toit.Proto.API.PubSub.Publish.PublishClient(channel);

            var request = new Toit.Proto.API.PubSub.PublishRequest
            {
                Topic = "cloud:hello-world",
                PublisherName = "C#",
                Data = { ByteString.CopyFromUtf8("Hello world") }
            };
            await client.PublishAsync(request);
        }
    }
}
