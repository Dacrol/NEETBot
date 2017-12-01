const {
  Markup,
  Extra
} = require('micro-bot')
const fetch = require('node-fetch').default
const moment = require('moment')

class ApiClient {
  /**
 * Searches for info on a show inline.
 *
 * @param {string} query
 */
  static async seriesSearchInline (query) {
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
      thumb_url: 'https://image.tmdb.org/t/p/w154/' + show.poster_path,
      input_message_content: {
        parse_mode: 'Markdown',
        message_text: `[\u200B](https://image.tmdb.org/t/p/w640${(show.backdrop_path != null) ? show.backdrop_path : show.poster_path})*${show.name}*\n[TMDb](https://www.themoviedb.org/tv/${show.id}/) rating: ${show.vote_average}\n \n${show.overview} \n`
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
  static async seriesSearch (ctx, query) {
    const res = await fetch(
      `http://api.themoviedb.org/3/search/tv?api_key=${
        process.env.TMDB_TOKEN
      }&query=${query}`,
      null
    )
    const json = await res.json()
    if (json.total_results === 0) {
      ctx.reply('No hits. Sorry!')
    } else {
      var show = json.results[0]
      var text = `[\u200B](https://image.tmdb.org/t/p/w640${(show.backdrop_path != null) ? show.backdrop_path : show.poster_path})*${show.name}*\n[TMDb](https://www.themoviedb.org/tv/${show.id}/) rating: ${show.vote_average}\n \n${show.overview} \n`
      ctx.replyWithMarkdown(
        `${text}`, Extra.markup(Markup.inlineKeyboard([Markup.callbackButton('Subscribe', 'subscribe')])
        )
      )
    }
  }

  /**
 * Searches info on a show
 *
 * @param {SceneContext} ctx
 * @param {string} query
 */
  static async nextEpSearch (ctx, query) {
    var res = await fetch(
      `http://api.themoviedb.org/3/search/tv?api_key=${
        process.env.TMDB_TOKEN
      }&query=${query}`,
      null
    )
    var json = await res.json()
    if (json.total_results === 0) {
      ctx.reply('No hits. Sorry!')
    } else {
      try {
        var show = json.results[0]
        var id = show.id
      } catch (TypeError) {
        ctx.reply('No match, sorry!')
        return
      }
      res = await fetch(
        `http://api.themoviedb.org/3/tv/${id}?api_key=${
          process.env.TMDB_TOKEN
        }`,
        null
      )
      // https://api.themoviedb.org/3/tv/73833?api_key=
      json = await res.json()
      try {
        // console.log(json)
        var season = json.number_of_seasons
        res = await fetch(
          `http://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${
            process.env.TMDB_TOKEN
          }`,
          null
        )
      } catch (TypeError) {
        ctx.reply('No match, sorry!')
        return
      }
      // https://api.themoviedb.org/3/tv/73833/season/1
      json = await res.json()
      console.log(json)
      const data = Object.entries(json)
      const dates = data[2][1].map((ep) => {
        return [ep.episode_number, ep.air_date]
      })
      const nextep = dates.find((ep) => {
        return moment(ep[1]).isAfter()
      })
      try {
        ctx.reply(`The next episode of ${show.name} is episode ${nextep[0]}, it airs on ${nextep[1]}`)
      } catch (TypeError) {
        ctx.reply('No match, sorry!')
      }
    }
  }
}

module.exports = ApiClient
