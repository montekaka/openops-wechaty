# OpenOps <> Wechaty

### How to get start

1. Install the package

```
npm install
```

2. Create a new .env file and add the wechaty took, e.g.

```
WECHATY_PUPPET_SERVICE_TOKEN=puppet_wxwork_TOKEN
```

3. Start the server by running

```
WECHATY_LOG=verbose \
WECHATY_PUPPET=wechaty-puppet-service \
WECHATY_PUPPET_SERVICE_NO_TLS_INSECURE_CLIENT=true \
npm start
```

4. .env file, e.g.

```
NODE_ENV=development
WECHATY_PUPPET_SERVICE_TOKEN=puppet_wxwork_key
BACKEND_HOST=http://localhost:8000
```

### Enpoints

1. Get friends on wechat

- GET: /v1/friends


2. Send Text message to friend (contact)

- POST: /v1/message

req body:

```
{
	"message": "Good night",
	"name": "Kaka"
}
```

3. Logout the wechaty bot

- GET: /v1/bot-logout

### Basic chat function

1. Able to send message to contact (DONE)
2. Able to receive message from contact (DONE)
3. Able to create QR code to invite friends
4. Able to receive friend request (DONE)
5. Able to approve friend request (DONE)