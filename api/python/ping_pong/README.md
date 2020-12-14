# PubSub ping pong

The application will send messages on the `cloud:demo/ping` and print all message received on `cloud:demo/pong`.
Use the `pong.toit` program to send replies back.

## Installation

First, install `pyhton3` and `pip3`, and then install `virtualenv`:

    pip3 install virtualenv

Then, setup and activate `virtualenv` for your project:

    virtualenv -p python3 env
    source env/bin/activate

Next install dependencies:
```
$ pip install -r requirements.txt
```

## Setup

In order to subscribe to a PubSub topic using the Toit API a subscription is needed.
The application will subscribe to `cloud:demo/pong` so we have to create a subscription for this:

```
$ toit pubsub subscription create cloud:demo/pong <subscription-name>
```

Example:

```
$ toit pubsub subscription create cloud:demo/pong MyPubsubTopic
```

## Run

Run the application with your toit username and password and the choosen subscription-name:

```
$ ./main.py <username> <password> <subscription-name>
```

Example:

```
$ ./main.py demo+test@toitware.com ******** MyPubsubTopic
```

While the python application is running in one tap run the toit application in another:

```
$ toit run -d <your-device> pong.toit
```

![ping pong](http://g.recordit.co/mtDjYTbFQk.gif)
