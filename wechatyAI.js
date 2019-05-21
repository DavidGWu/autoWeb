#!/usr/bin/env node
/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
//Install with package.json using npm
const qrTerm = require('qrcode-terminal')

const Tuling123 = require('tuling123-client')
const TULING123_API_KEY = 'd346c0902e254de0822eed15c0fc3c49'
const tuling = new Tuling123(TULING123_API_KEY)

const {
    IoClient,
    Contact,
    Wechaty,
    config,
    log,
} = require('wechaty')

async function sayTulin(room) {
    try {
        const { text: reply } = await tuling.ask("hello")
        console.log('Tuling123', 'Talker reply:"%s" for "%s" ',
            reply
        )
    } catch (e) {
        console.error('Bot', 'on message tuling.ask() exception: %s', e && e.message || e)
    }
}


console.log(`
=============== Powered by Wechaty ===============
-------- https://github.com/Chatie/wechaty --------

I'm the BUSY BOT, I can do auto response message for you when you are BUSY.

Send command to FileHelper to:

1. '#busy' - set busy mode ON
2. '#busy I'm busy' - set busy mode ON and set a Auto Reply Message
3. '#free' - set busy mode OFF
4. '#status' - check the current Busy Mode and Auto Reply Message.

Loading... please wait for QrCode Image Url and then scan to login.
`)

let bot

let contactArray = []
let contactSel
let botroom
let botisOn = false
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

bot
    .on('scan', (qrcode, status) => {
        qrTerm.generate(qrcode, { small: true })
        console.log(`${status}: ${qrcode} - Scan QR Code of the url to login:`)
        console.log(`Optional - Scan QR Code to login: ${status}\nhttps://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrcode)}`)
    })
    .on('logout', user => log.info('Bot', `${user.name()} logouted`))
    .on('error', e => log.info('Bot', 'error: %s', e))

    .on('login', async function (user) {
        const msg = `${user.name()} logined`

        log.info('Bot', msg)
        await this.say(msg)
        const filehelper = bot.Contact.load('filehelper')
        filehelper.say('DavidAI: Logged In' + msg)

    })

/**
 * Global Event: Contact Ops
 */

async function saveAvatar(contact) {
    /**
             * Save avatar to file like: "1-name.jpg"
             */
    const file = Promise.all(await contact.avatar())
    const name = file.name
    await file.toFile(name, true)

    log.info('Bot', 'Contact: "%s" with avatar file: "%s"',
        contact.name(),
        name, x
    )
}

async function getContacts() {
    const contactList = await bot.Contact.findAll()

    log.info('Bot', '#######################')
    log.info('Bot', 'Contact number: %d\n', contactList.length)

    /**
     * official contacts list
     */
    for (let i = 0; i < contactList.length; i++) {
        const contact = contactList[i]
        if (contact.type() === Contact.Type.Official) {
            log.info('Bot', `official ${i}: ${contact}`)
        }
    }

    /**
     *  personal contact list
     */

    for (let i = 0; i < contactList.length; i++) {
        const contact = contactList[i]
        if (!contact.friend())
            log.info('bot personal', contact.name, ' is not friend')
        if (contact.type() === Contact.Type.Personal) {
            contactArray.push({
                index: i,
                name: contact.name,
                id: contact.id,
                type: contact.type,
                gender: contact.gender,
                alias: contact.alias
            })
            log.info('Bot', `personal ${i}: ${contact.name()} : ${contact.id}`)
        }
    }




}

let busyIndicator = false
let busyRoomIndicator = false
let busyAnnouncement = `Automatic Reply: I cannot read your message because I'm busy now, will talk to you when I get back.`
let targetList = []



bot.on('message', async function (msg) {
    log.info('Bot', '(message) %s', msg)

    const filehelper = bot.Contact.load('filehelper')

    const sender = msg.from()
    const receiver = msg.to()
    const text = msg.text()
    const room = msg.room()

    // if (msg.age() > 60) {
    //   log.info('Bot', 'on(message) skip age(%d) > 60 seconds: %s', msg.age(), msg)
    //   return
    // }
    if (msg.room)
        if (!sender || !receiver) {
            return
        }

    if (receiver.id === 'filehelper') {
        if (text.substring(0, 1) === '/') {
            let cmd = text.split(" ")


            if (cmd[0] === "/contact") {
                getContacts()
                contactArray.forEach(function (element) {
                    console.log(element);
                    filehelper.say(element.index, ' ', element.name, ' ', element.alias, ' ', element.gender)
                });
            }

            // Contact.findAll()
            if (cmd[0] === "/contactlist") {
                const contactList = await bot.Contact.findAll()
                console.log('bot.Contact.findAll() done.')

                const totalNum = contactList.length
                let n = 0

                const replyText = [
                    `Total contact number: ${totalNum}`,
                    contactList
                        .slice(0, 17)
                        .map(contact => contact.name())
                        .map(name => ++n + '. ' + name),
                ].join('\n')

                await filehelper.say(replyText)

                return
            }


            if (cmd[0] === "/find") {
                console.log(cmd[1])
                contactSel = await bot.Contact.find({ name: new RegExp(cmd[1]) })
                if (contactSel) {
                    var info = "Found: " + contactSel.name
                    filehelper.say(info)
                    contactSel.say("Hi")
                }
                else {
                    filehelper.say("Not Found")
                }

            }

            if (cmd[0] === "/findroom") {
                const searchRegex = new RegExp(cmd[1])
                const room = await bot.Room.find({ topic: searchRegex })
                console.log(searchRegex)

                if (!room) {
                    console.log('not found')
                    return
                } else {
                    console.log(await room.topic(), 'found')
                    botroom = room

                }

            }

            if (cmd[0] === "/ai") {
                if (botisOn) {
                    botisOn = false
                    targetList = []
                    console.log('tulin off')
                    filehelper.say("AI OFF")
                }
                else {
                    botisOn = true
                    console.log('tulin on')
                    filehelper.say("AI ON")
                }
            }

            if (cmd[0] === "/addlist") {
                const searchContact = await bot.Contact.find({ name: new RegExp(cmd[1]) })
                const searchRoom = await bot.Room.find({ topic: new RegExp(cmd[1]) })
                if (searchContact) {
                    filehelper.say("Found Contact: " + searchContact.name())
                    targetList.push({
                        content: searchContact,
                        type: 0
                    })

                }
                if (searchRoom) {
                    filehelper.say("Found Room: " + await searchRoom.topic())
                    targetList.push({
                        content: searchRoom,
                        type: 1
                    })
                }

            }

            if (cmd[0] === "/spam" && contactSel != null) {
                for (let i = 0; i < parseInt(cmd[2]); i++) {
                    await contactSel.say(cmd[1])
                }
                contactSel.say(cmd[1])
            }

        }


        if (text === '#status') {
            await filehelper.say('in busy mode: ' + busyIndicator)
            await filehelper.say('auto reply: ' + busyAnnouncement)

        } else if (text === '#free') {
            busyIndicator = false
            busyRoomIndicator = false
            await filehelper.say('auto reply stopped.')

        } else if (/^#busy/i.test(text)) {

            busyIndicator = true
            await filehelper.say('in busy mode: ' + 'ON')

            const matches = text.match(/^#busy (.+)$/i)
            if (!matches || !matches[1]) {
                await filehelper.say('auto reply message: "' + busyAnnouncement + '"')

            } else {
                busyAnnouncement = matches[1]
                await filehelper.say('set auto reply to: "' + busyAnnouncement + '"')

            }
        }

        return
    }


    if (botisOn) {
        let trageted = -1;
        //if (msg.self() || msg.room() || msg.from().name() === '微信团队' || msg.type() !== Message.Type.Text) return
        if (msg.self() || msg.from().name() === '微信团队' || msg.type() !== bot.Message.Type.Text) return

        targetList.forEach(async function (e) {
            // console.log(e);

            if (msg.room()) {
                if (e.type == 1 && msg.room() == e.content) {
                    console.log("Found Room in targetlist");
                    trageted = 1
                }
            }
            else if (e.type == 0 && msg.from() == e.content) {
                console.log("Found Contact in targetlist");
                trageted = 0
            }


        });

        if (trageted != -1) {
            console.log('Someone', 'talk: %s', msg.text())
            try {
                //const { text: reply } = await tuling.ask(text, { userid: msg.from() })
                let { text: reply } = await tuling.ask(msg.text())

                console.log('Tuling123', 'Talker reply:"%s" for "%s" ',
                    reply,
                    msg.text(),
                )
                if (trageted == 0) {
                    reply = msg.from().name() + ", " + reply
                } else if (trageted == 1) {
                    reply = msg.room().topic() + "," + reply
                }


                await msg.say(reply)
            } catch (e) {
                console.error('Bot', 'on message tuling.ask() exception: %s', e && e.message || e)
            }

        }
    }

    if (sender.type() !== bot.Contact.Type.Personal) {
        //return
    }

    if (!busyIndicator) {
        //return  // free
    }

    if (msg.self()) {
        return
    }

    // /**
    //  * 1. Send busy anoncement to contact
    //  */
    // if (!room && !busyRoomIndicator) {
    //     await msg.say(busyAnnouncement)
    //     return
    // } else if (busyRoomIndicator && room == roomToLive) {
    //     await msg.say(busyAnnouncement)
    //     return
    // }

    // /**
    //  * 2. If there's someone mentioned me in a room,
    //  *  then send busy annoncement to room and mention the contact who mentioned me.
    //  */
    // const contactList = await msg.mention()
    // const contactIdList = contactList.map(c => c.id)
    // if (contactIdList.includes(this.userSelf().id)) {
    //     await msg.say(busyAnnouncement, sender)
    // }

})

bot.start()
    .catch(e => console.error(e))
