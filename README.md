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

### Enpoints

1. Get friends on wechat

GET: http://localhost:8080/friends


2. Send Text message to friend (contact)

POST: http://localhost:8080/message

req body:

```
{
	"message": "Good night",
	"name": "Kaka"
}
```


