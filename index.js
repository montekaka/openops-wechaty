import { Wechaty, Message, Contact } from 'wechaty'
import { ScanStatus } from 'wechaty-puppet'
import QrcodeTerminal from 'qrcode-terminal';
import express from 'express';
import dotenv from 'dotenv';
import axios from "axios";

const router = express.Router();
let botOwner = null;

dotenv.config();
let port = 3000;
if( process.env.NODE_ENV === 'development') {
  port = 7001
}

const app = express();
app.use(express.json()); 
app.use(express.urlencoded({extended:false}));
// app.use(logger('dev'));

// handle cross sites request
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if([process.env.BACKEND_HOST].indexOf(origin) > -1){
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Origin', origin);
  // res.header("Access-Control-Allow-Origin", process.env.ALLOW_CLIENT_WHITE_LIST);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");  

  next();
});

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
    botOwner = user;
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
      // const contact = message.from();
      
      const contact = message.talker()
      const avatar = await contact.avatar();
      // Make a request to the backend server:
      // 1. save the message to database
      // 2. send the message to front end client app throught socket.io
      await axios.post(`${process.env.BACKEND_HOST}/v1/forward-message`, {
        kfWechatId: botOwner.id,        
        socketId: `wechat_${contact.id}`,
        content: message.text(), 
        createTime: message.date(), 
        fromUserName: contact.name(), 
        fromUserAvatar: avatar.remoteUrl,
        fromUserId: contact.id,
        messageType: 'receive'
      })
    }
    // console.log(`message: ${JSON.stringify(message)}`)
    // console.log(`message ${message.text()}`)
  })
  .on('friendship', async (friendship) => {
    const contact = friendship.contact();
    try {
      const avatar = await contact.avatar();
      await axios.post(`${process.env.BACKEND_HOST}/v1/wechat-friendship`, {
        kfWechatId: botOwner.id, 
        fromUserName: contact.name(), 
        fromUserId: contact.id,
        fromUserAvatar: avatar.remoteUrl
      })         
      console.log(`received friend event (${friendship.type()})from ${friendship.contact().name()}`)
        // Make a post request to backend server to notice added a new friend    
      if (friendship.type() === bot.Friendship.Type.Receive ) {
        await friendship.accept()
        // Make a post request to backend server to notice added a new friend
        console.log('accepted friendship....')     
      }
    } catch (e) {
      console.error(e)
    }    
  })
  .start()  
}

await startBot();
// routers

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

router.get('/v1/bot-logout', async(req, res) => {
  try {
    await bot.logout();
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
router.post('/v1/message', async (req, res) => {
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

app.use(router);

app.listen(port, () => {
  console.log(`App version 1.0 listening on port ${port}!`);  
});
