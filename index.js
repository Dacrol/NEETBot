const {
  Composer,
  Scene,
  Stage,
  log,
  session
} = require('micro-bot')
// const { enter } = Stage
const ApiClient = require('./helpers/api-client')
const TeleAnyCase = require('./helpers/anycase')

const argsRegex = /^\/([^\s]+)\s?([\s\S]*)$/

// Setup bot
const bot = TeleAnyCase.apply(new Composer())

// Echo requests to console
bot.use(log())
bot.use(session())

// Setup scenes

// Normal search scene
const showSearchScene = new Scene('search')
showSearchScene.enter(ctx => ctx.reply('What is the name of the show?'))
showSearchScene.command((ctx, next) => {
  ctx.scene.leave()
  next(ctx)
})
showSearchScene.on('text', (ctx, next) => {
  if (ctx.scene.current) {
    ApiClient.seriesSearch(ctx, ctx.message.text)
    ctx.scene.leave()
  } else {
    next(ctx)
  }
})

// Next episode scene
const nextEpSearchScene = new Scene('nextEpSearch')
nextEpSearchScene.enter(ctx => ctx.reply('What show?'))

nextEpSearchScene.on('text', (ctx, next) => {
  if (ctx.scene.current) {
    ApiClient.nextEpSearch(ctx, ctx.message.text)
    ctx.scene.leave()
  } else {
    next(ctx)
  }
})

// Last episode scene
const lastEpSearchScene = new Scene('lastEpSearch')
lastEpSearchScene.enter(ctx => ctx.reply('What show?'))

lastEpSearchScene.on('text', (ctx, next) => {
  if (ctx.scene.current) {
    ApiClient.lastEpSearch(ctx, ctx.message.text)
    ctx.scene.leave()
  } else {
    next(ctx)
  }
})


// Setup stage
const stage = new Stage([showSearchScene, nextEpSearchScene, lastEpSearchScene], {
  ttl: 30
})
bot.use(stage.middleware())

bot.command('search', (ctx) => {
  const searchTerm = argsRegex.exec(ctx.message.text)[2]
  if (/\S/.test(searchTerm)) {
    ApiClient.seriesSearch(ctx, searchTerm.trim())
  } else {
    ctx.scene.enter('search')
  }
})

// For testing
bot.command('EchO',
  /**
   * @param { TelegrafContext } ctx
   */
  ctx => {
    const echo = argsRegex.exec(ctx.message.text)[2]
    if (echo) {
      ctx.reply(echo)
    }
  })

// Bot commands
bot.command('start', ctx => showStartMenu(ctx))
bot.command('myshows', ({ reply }) => {
  return reply('You are not subscribed to any shows yet.')
})


bot.command(['nextep', 'nextepisode'], async (ctx) => {
  const searchTerm = argsRegex.exec(ctx.message.text)[2]
  if (/\S/.test(searchTerm)) {
    ApiClient.nextEpSearch(ctx, searchTerm.trim())
  } else {
    ctx.scene.enter('nextEpSearch')
  }
})

bot.command(['lastep', 'lastepisode', 'prevep', 'previousep', 'previousepisode'], async (ctx) => {
  const searchTerm = argsRegex.exec(ctx.message.text)[2]
  if (/\S/.test(searchTerm)) {
    ApiClient.lastEpSearch(ctx, searchTerm.trim())
  } else {
    ctx.scene.enter('lastEpSearch')
  }
})

// Actions aka keyboard callbacks
bot.action('subscribe', (ctx, next) => {
  ctx.editMessageReplyMarkup({})
  return ctx.reply('Subscribed 👍')
})

// When receiving any message which is not a command
bot.on('message', ctx => showStartMenu(ctx))

// When receiving an inline query from the outside
bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
  var iqResult = await ApiClient.searchInline(inlineQuery.query)
  return answerInlineQuery(iqResult)
})

module.exports = bot

/**
 * Shows a menu on /start
 *
 * @param {TelegrafContext} ctx
 */
function showStartMenu (ctx) {
  ctx.replyWithMarkdown(`*“*_The sky above the port was the color of television, tuned to a dead channel._ *”*
          — William Gibson, Neuromancer\n
Available commands:\n
/search - Search for information on a show.
/nextep - Find when the next episode of a show is airing.
/lastep - Find when the last aired episode of a show aired.
(Coming soon) /subscribe - Receive alerts when new episodes air.
(Coming soon) /myshows - Shows all series you are subscribed to.
Use @NEETShowBot in any chat to search for show information inline!\n`)
}
