import { Wechaty, Message, Contact } from 'wechaty'
import { ScanStatus } from 'wechaty-puppet'
import QrcodeTerminal from 'qrcode-terminal';
import express from 'express';
import dotenv from 'dotenv';
import { createServer } from "http";
import { Server, Socket } from "socket.io";

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
    }
    console.log(`message: ${JSON.stringify(message)}`)
    console.log(`message ${message.text()}`)
  })
  .start()  
}


await startBot();
// routers

router.get('/start-bot', async(req, res) => {
  try {
    await startBot()
    res.sendStatus(200);    
  } catch(err) {
    res.sendStatus(500);
  }  
})

router.get('/stop-bot', async(req, res) => {
  try {
    await bot.stop();
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
})

// get all friends from the wechat sign in user
router.get('/friends', async (req, res) => {
  try {
    const friends = await bot.Contact.findAll();
    res.send(friends);
  } catch (err) {
    res.sendStatus(500)
  }
})

// Basic chat functoins
// send message to wechat contact by name
router.post('/message', async (req, res) => {
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

io.on('connect', socket => {
  console.log('User connected')
  socket.on('disconnect', () => {
    console.log('User disconnected')
  })
})

httpServer.listen(port, () => {
  console.log(`App version 1.0 listening on port ${port}!`);
})


// app.listen(port, () => {
//   console.log(`App version 1.0 listening on port ${port}!`);  
// });



// const bot = new Wechaty()
// await bot.start()
// const contacts = await bot.Contact.findAll();