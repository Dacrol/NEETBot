const {
  Markup,
  Extra
} = require('micro-bot')
const fetch = require('node-fetch').default

class ApiClient {
  /**
 * Searches for info on a show inline.
 *
 * @param {string} query
 */
  async seriesSearchInline (query) {
    const res = await fetch(
      `http://api.themoviedb.org/3/search/tv?api_key=${
        process.env.TMDB_TOKEN
      }&query=${query}`,
      null
    )
    const { results } = await res.json()
    const shows = results

    const response = shows.map(show => ({
      type: 'article',
      id: show.id,
      url: 'https://www.themoviedb.org/tv/' + String(show.id) + '/',
      title: show.name,
      description: show.overview,
      thumb_url: 'https://image.tmdb.org/t/p/w640/' + show.poster_path,
      input_message_content: {
        parse_mode: 'Markdown',
        message_text: `[\u200B](https://image.tmdb.org/t/p/w640/${(show.backdrop_path != null) ? show.backdrop_path : show.poster_path})*${show.name}*\n[TMDb](https://www.themoviedb.org/tv/${show.id}/) rating: ${show.vote_average}\n \n${show.overview} \n`
      }
    }))
    return response
  }

  /**
 * Searches info on a show
 *
 * @param {SceneContext} ctx
 * @param {string} query
 */
  async seriesSearch (ctx, query) {
    const res = await fetch(
      `http://api.themoviedb.org/3/search/tv?api_key=${
        process.env.TMDB_TOKEN
      }&query=${query}`,
      null
    )
    const json = await res.json()
    console.log(json)
    if (json.total_results === 0) {
      ctx.reply('No hits. Sorry!')
    } else {
      ctx.reply(
        `${json.results[0].name} \n
  ${json.results[0].overview}\n`,
        Extra.markup(
          Markup.inlineKeyboard([Markup.callbackButton('Subscribe', 'subscribe')])
        )
      )
    }
  }
}

module.exports = ApiClient
