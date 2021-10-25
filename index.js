import { Wechaty, Message, Contact } from 'wechaty'
import { ScanStatus } from 'wechaty-puppet'
import QrcodeTerminal from 'qrcode-terminal';
import express from 'express';
import dotenv from 'dotenv';

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

const bot = new Wechaty({
  name: 'openops-wechaty-bot',
  puppet: 'wechaty-puppet-service',
  puppetOptions: {
    token: process.env.WECHATY_PUPPET_SERVICE_TOKEN
  }
});

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
  })
  .start()  

// routers

router.get('/start-bot', async(req, res) => {
  try {
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
    })
    .start()  
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

app.listen(port, () => {
  console.log(`App version 1.0 listening on port ${port}!`);  
});



// const bot = new Wechaty()
// await bot.start()
// const contacts = await bot.Contact.findAll();