using System;
using System.Linq;
using System.Threading.Tasks;
using Grpc.Core;
using Grpc.Net.Client;
using Toit.Api.Pubsub;

namespace toit.demos.api.csharp.pubsubsubscribe
{
    public class Program
    {
        private static string apikey = "<apikey>"; // From: https://console.toit.io/project/apikeys
        private static readonly Subscription TopicSubscription = new Subscription { Name = "csharp", Topic = "cloud:hello-world" };
        
        static async Task Main(string[] args)
        {
            var callCredentials = CallCredentials.FromInterceptor((context, metadata) =>
            {
                metadata.Add("Authorization", $"Bearer {apikey}");
                return Task.CompletedTask;
            });
            var channelCredentials = ChannelCredentials.Create(new SslCredentials(), callCredentials);
            using var channel = GrpcChannel.ForAddress("https://api.toit.io:443", new GrpcChannelOptions
            {
                Credentials = channelCredentials
            });

            var client = new Subscribe.SubscribeClient(channel);

            // Create a subscription if not already exists
            var subscriptions = await client.ListSubscriptionsAsync(new ListSubscriptionsRequest { Topic = TopicSubscription.Topic });
            if (subscriptions.Subscriptions.All(name => name.Name != TopicSubscription.Name))
                await client.CreateSubscriptionAsync(new CreateSubscriptionRequest { Subscription = TopicSubscription });
            
            do
            {
                FetchResponse fetchResponse;
                do
                {
                    Console.WriteLine("Polling");
                    fetchResponse = await client.FetchAsync(new FetchRequest { Subscription = TopicSubscription});

                } while (!fetchResponse.Messages.Any());

                foreach (var message in fetchResponse.Messages)
                {
                    Console.WriteLine(message.Message.Data.ToStringUtf8());
                    await client.AcknowledgeAsync(new AcknowledgeRequest { Subscription = TopicSubscription, EnvelopeIds = { message.Id } });
                }

            } while (true);
        }
    }
}
