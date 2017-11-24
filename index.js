const {
  Composer,
  Scene,
  Stage,
  log,
  session
} = require('micro-bot')
const { enter } = Stage
const ApiClient = require('./helpers/api-client')
const bot = new Composer()
let apiClient = new ApiClient()

// Setup scenes
const showSearchScene = new Scene('search')
showSearchScene.enter(ctx => ctx.reply('What is the name of the show?'))
showSearchScene.on('text', ctx => apiClient.seriesSearch(ctx, ctx.message.text))
showSearchScene.leave()

// Setup stage
const stage = new Stage([showSearchScene], {
  ttl: 15
})

// Setup bot
module.exports = bot
// Echo requests to console
bot.use(log())
bot.use(session())
bot.use(stage.middleware())

// Bot commands
bot.command('start', ctx => showStartMenu(ctx))
bot.command('myshows', ({ reply }) => {
  return reply('You are not subscribed to any shows yet.')
})
bot.command('search', enter('search'))

// Actions aka keyboard callbacks
bot.action('subscribe', (ctx, next) => {
  return ctx.reply('Subscribed 👍')
})

// When receiving any message which is not a command
bot.on('message', ctx => showStartMenu(ctx))

// When receiving an inline query from the outside
bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
  // console.log(shows)
  // console.log(response)
  var iqResult = await apiClient.seriesSearchInline(inlineQuery.query)
  return answerInlineQuery(iqResult)
})

/**
 * Shows a menu on /start
 *
 * @param {TelegrafContext} ctx
 */
function showStartMenu (ctx) {
  ctx.reply(`Welcome to the real world ${ctx.from.first_name}.\n
Available commands:\n
/search - Search for a show.
/myshows - Shows all series you are subscribed to.\n`)
}
