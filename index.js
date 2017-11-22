const {
  Composer,
  Markup,
  Scene,
  Extra,
  Stage,
  log,
  session
} = require('micro-bot')
const { enter } = Stage
const fetch = require('node-fetch')

const bot = new Composer()

// Setup scenes
const searchScene = new Scene('search')
searchScene.enter(ctx => ctx.reply('What is the name of the show?'))
searchScene.on('text', ctx => seriesSearch(ctx, ctx.message.text))
searchScene.leave()

// Setup stage
const stage = new Stage([searchScene], {
  ttl: 15
})

// Setup bot
module.exports = bot
// Echo requests to console
bot.use(log())
bot.use(session())
bot.use(stage.middleware())

// Commands
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
bot.on('inline_query', ctx => {
  const result = []
  ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)
})

function showStartMenu (ctx) {
  ctx.reply(`Welcome to the real world ${ctx.from.first_name}.\n
Available commands:\n
/search - Search for a show.
/myshows - Shows all series you are subscribed to.\n`)
}

async function seriesSearch (ctx, name) {
  ctx.reply(`Searching for ${name}. Hold on!`)
  ctx.scene.leave()
  const res = await fetch(
    `http://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_TOKEN}&query=${name}`,
    null
  )
  const json = await res.json()
  console.log(json)
  if (json.total_results === 0) {
    ctx.reply('No hits. Sorry!')
  } else {
    ctx.reply(`${json.results[0].name} \n
${json.results[0].overview}\n`, Extra.markup(Markup.inlineKeyboard([
      Markup.callbackButton('Subscribe', 'subscribe')
    ])
    ))
  }
}
