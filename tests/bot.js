import test from 'ava'
const Telegraf = require('telegraf')

const TeleAnyCase = require('../helpers/anycase')
const NEETBot = require('../index')

const message = {
  chat: { id: 4 },
  from: { id: 1, username: 'Dacrol' }
}

test.cb('should work with anycased commands', t => {
  const bot = TeleAnyCase.apply(new Telegraf())
  bot.command('/tesT', (ctx) => t.end())
  bot.handleUpdate({message: Object.assign({text: '/TEst', entities: [{type: 'bot_command', offset: 0, length: 5}]}, message)})
})
