import { Wechaty, Message, Contact } from 'wechaty'
import { ScanStatus } from 'wechaty-puppet'
import QrcodeTerminal from 'qrcode-terminal';
import express from 'express';
import dotenv from 'dotenv';
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import axios from "axios";

const router = express.Router();

dotenv.config();
let port = 3000;
if( process.env.NODE_ENV === 'development') {
  port = 8080; //49160
}

const app = express();
app.use(express.json()); 
app.use(express.urlencoded({extended:false}));
// app.use(logger('dev'));

// socket.io config
const httpServer = createServer(app);
// https://stackoverflow.com/questions/59749021/socket-io-error-access-to-xmlhttprequest-has-been-blocked-by-cors-policy

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_HOST,
    methods: ["GET", "POST"]
  }
});

// handle cross sites request
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if([process.env.CLIENT_HOST].indexOf(origin) > -1){
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Origin', origin);
  // res.header("Access-Control-Allow-Origin", process.env.ALLOW_CLIENT_WHITE_LIST);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.io = io; // add socket.io

  next();
});

io.on('connect', socket => {
  console.log('User connected')
  socket.on('disconnect', () => {
    console.log('User disconnected')
  })
})


const bot = new Wechaty({
  name: 'openops-wechaty-bot',
  puppet: 'wechaty-puppet-service',
  puppetOptions: {
    token: process.env.WECHATY_PUPPET_SERVICE_TOKEN
  }
});

const startBot = async () => {
  await bot
  .on('scan', (qrcode, status) => {
    if (status === ScanStatus.Waiting) {
      QrcodeTerminal.generate(qrcode, {
        small: true
      })
    }
  })
  .on('login', async user => {
    console.log(`user: ${JSON.stringify(user)}`)
  })
  .on('message', async message => {
    if (message.type() !== Message.Type.Text) {
      const file = await message.toFileBox();
      const name = file.name;
      console.log("Save file to: " + name);
    } else if (message.type() === Message.Type.Text) {
      // forward to cleint app with socket.io
      // message: {"_events":{},"_eventsCount":0,"id":"1000867","payload":{"filename":"","fromId":"7881300233152715","id":"1000867","mentionIdList":[],"roomId":"","text":"Hi ","timestamp":1635223643000,"toId":"1688857120246081","type":7}}
      const contact = message.from();
      // const toContact = message.to();
      // console.log({
      //   from: contact.id,
      //   content: message.text(), 
      //   createTime: message.date(), 
      //   fromUserName: contact.name(), 
      //   messageType: 'receive'
      // })

      // io.emit(`wechat_${contact.id}`, {
      //   content: message.text(), 
      //   createTime: message.date(), 
      //   fromUserName: contact.name(), 
      //   messageType: 'receive'
      // }); 
      axios.post(`${process.env.BACKEND_HOST}/v1/forward-message`, {
        socketId: `wechat_${contact.id}`,
        content: message.text(), 
        createTime: message.date(), 
        fromUserName: contact.name(), 
        messageType: 'receive'
      })
    }
    // console.log(`message: ${JSON.stringify(message)}`)
    // console.log(`message ${message.text()}`)
  })
  .start()  
}

await startBot();
// routers

router.post('/v1/forward-message', async(req, res) => {
  const data = req.body;
  const socketId = data.socketId;
  res.io.emit(socketId, data);
  res.send('success');
})

router.get('/v1/start-bot', async(req, res) => {
  try {
    await startBot()
    res.sendStatus(200);    
  } catch(err) {
    res.sendStatus(500);
  }  
})

router.get('/v1/stop-bot', async(req, res) => {
  try {
    await bot.stop();
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
})

// get all friends from the wechat sign in user
router.get('/v1/friends', async (req, res) => {
  try {
    const friends = await bot.Contact.findAll();
    res.send(friends);
  } catch (err) {
    res.sendStatus(500)
  }
})

// Basic chat functoins
// send message to wechat contact by name
router.post('/v1/wecom-send-message', async (req, res) => {
  const name = req.body.name;
  const message = req.body.message;
  
  if(name) {
    try {
      const contact = await bot.Contact.find({name});
      await contact.say(message);
      res.send({
        id: contact.id,
        message
      })
    } catch(err) {
      console.log(err);
      res.sendStatus(500)
    }
  } else {
    res.sendStatus(500)
  }
})

// data for getting list of contacts 
router.get('/v1/contacts', (req, res) => {
  res.send([
    {"name": "Kaka", "id": "7881300233152715", "avatar": "http://mmhead.c2c.wechat.com/mmhead/SMt4cxnN46q1o0KsondHotCuFkCZh28ZbKHichbnFRFbiad2ZkRFswkg/0"},
    {"name": "may 张丹萍", "id": "7881302734171450", "avatar": "http://mmhead.c2c.wechat.com/mmhead/bVy2VQVTWzbNu2kVtzRgbiaPAO53Ws8uG1HB7PS2bBGNr6mEfj80XUA/0"}
  ])
})

app.use(router);

httpServer.listen(port, () => {
  console.log(`App version 1.0 listening on port ${port}!`);
})

