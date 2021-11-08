<?php
require __DIR__ . '/vendor/autoload.php';

$apiKey = getenv("TOIT_API_KEY");
if (!$apiKey) {
    print "TOIT_API_KEY environment variable must be set\n";
    exit(1);
}

$client = new Toit\Api\DeviceServiceClient('api.toit.io:443', [
    'credentials' => Grpc\ChannelCredentials::createSsl(),
    'update_metadata' => function($md){
        global $apiKey;
        $md['Authorization'] = ['Bearer ' . $apiKey];
        return $md;
     }
]);

list($resp, $status) = $client->ListDevices(new Toit\Api\ListDevicesRequest())->wait();

if ($status->code != Grpc\STATUS_OK) {
    print "failed to fetch devices: " . $status->code . "\n";
    exit(1);
}
foreach ($resp->getDevices() as $device) {
    print $device->GetConfig()->GetName() . "\n";
}
?>
