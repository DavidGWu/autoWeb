//const { Wechaty } = require('wechaty') // import { Wechaty } from 'wechaty'

const qrTerm = require('qrcode-terminal')

const {
  IoClient,
  Wechaty,
  config,
  log,
} = require('wechaty')

let bot

const token = config.token

//test send msg



if (token) {
  log.info('Wechaty', 'TOKEN: %s', token)

  bot = Wechaty.instance({ profile: token })
  const ioClient = new IoClient({
    token,
    wechaty: bot,
  })

  ioClient.start().catch(e => {
    log.error('Wechaty', 'IoClient.init() exception: %s', e)
    bot.emit('error', e)
  })
} else {
  log.verbose('Wechaty', 'TOKEN: N/A')
  bot = Wechaty.instance()
}

Wechaty.instance() // Global Instance
.on('scan', (qrcode, status) => console.log(`Scan QR Code to login: ${status}\nhttps://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrcode)}`))
.on('login',            user => console.log(`User ${user} logined`))
.on('message',       message => console.log(`Message: ${message}`))
.start()