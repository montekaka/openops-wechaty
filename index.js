import { Wechaty, Message } from 'wechaty'
import { ScanStatus } from 'wechaty-puppet'
import QrcodeTerminal from 'qrcode-terminal';

const bot = new Wechaty({
  puppet: 'wechaty-puppet-service',
  // puppetOptions: {
  //   token,
  // }
});

bot
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

// const bot = new Wechaty()
// await bot.start()
// const contacts = await bot.Contact.findAll();