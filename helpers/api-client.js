const { Markup, Extra } = require('micro-bot')
const fetch = require('node-fetch').default
const moment = require('moment')
require('moment-duration-format')

class ApiClient {

/**
 *
 *
 * @static
 * @param {string} query
 * @returns {Promise<string>} response
 * @memberof ApiClient
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
    if (typeof shows !== 'undefined') {
      const response = shows.map(show => ({
        type: 'article',
        id: show.id,
        url: 'https://www.themoviedb.org/tv/' + String(show.id) + '/',
        title: show.name,
        description: show.overview,
        thumb_url: 'https://image.tmdb.org/t/p/w154/' + show.poster_path,
        input_message_content: {
          parse_mode: 'Markdown',
          message_text: `[\u200B](https://image.tmdb.org/t/p/w640${
            show.backdrop_path != null ? show.backdrop_path : show.poster_path
          })*${show.name}*\n[TMDb](https://www.themoviedb.org/tv/${
            show.id
          }/) rating: ${show.vote_average}\n \n${show.overview} \n`
        }
      }))
      return response
    }
  }

  /**
   * Searches info on a show
   *
   * @param {SceneContext} ctx
   * @param {string} query
   */
  static async seriesSearch (ctx, query) {
    const res = await fetch(
      `http://api.themoviedb.org/3/search/multi?api_key=${
        process.env.TMDB_TOKEN
      }&query=${query}`,
      null
    )
    const json = await res.json()
    if (json.total_results === 0) {
      ctx.reply('No hits. Sorry!')
    } else {
      let show = json.results[0]
      const type = show.media_type
      if (!type) {
        ctx.reply('No hits, sorry!')
        return
      }
      let text = `[\u200B](https://image.tmdb.org/t/p/w640${
        show.backdrop_path != null ? show.backdrop_path : show.poster_path
      })*${show.name || show.title}*\n[TMDb](https://www.themoviedb.org/${type}/${
        show.id
      }/) rating: ${show.vote_average}\n \n${show.overview} \n`
      ctx.replyWithMarkdown(
        `${text}`,
        Extra.markup(
          Markup.inlineKeyboard([
            Markup.callbackButton('Subscribe', 'subscribe')
          ])
        )
      )
    }
  }

  /**
   * Find the next episode of a show
   *
   * @static
   * @param {TelegrafContext} ctx a TelegrafContext to reply to
   * @param {string} query Name of the show
   * @memberof ApiClient
   */
  static async nextEpSearch (ctx, query) {
    const show = await getShowDetails(query)
    if (typeof show === 'string') {
      ctx.reply(show)
      return
    }
    if (show.external_ids.tvdb_id > 0) {
      var episodeData = await episodeDataFromTVMaze(
        'thetvdb',
        show.external_ids.tvdb_id
      )
    }
    if (
      episodeData &&
      episodeData._embedded &&
      episodeData._embedded.nextepisode
    ) {
      (show => {
        let nextEp = show._embedded.nextepisode
        let time = moment(nextEp.airstamp)
        ctx.reply(
          `The next episode of ${show.name} is episode number ${
            nextEp.number
          },${(nextEp.name.length < 1 || nextEp.name.startsWith('Episode')) ? '' : ' "' + nextEp.name + '",'} which airs on ${time
            .utcOffset(1)
            .format('dddd, MMMM Do, h:mm a')} (in ${moment.duration(time.diff(moment())).format('d [days], h [hours], m [minutes]')}).`
        )
      })(episodeData)
    } else {
      ctx.reply('No match, sorry! (Could not find any future episodes)')
    }
  }

  /**
   * Find the last episode of a show
   *
   * @static
   * @param {TelegrafContext} ctx a TelegrafContext to reply to
   * @param {string} query Name of the show
   * @memberof ApiClient
   */
  static async lastEpSearch (ctx, query) {
    const show = await getShowDetails(query)
    if (typeof show === 'string') {
      ctx.reply(show)
      return
    }
    if (show.external_ids.tvdb_id > 0) {
      var episodeData = await episodeDataFromTVMaze(
        'thetvdb',
        show.external_ids.tvdb_id
      )
    }
    if (
      episodeData &&
      episodeData._embedded &&
      episodeData._embedded.previousepisode
    ) {
      (show => {
        let lastEp = show._embedded.previousepisode
        let time = moment(lastEp.airstamp)
        ctx.reply(
          `The last episode of ${show.name} was episode number ${
            lastEp.number
          },${(lastEp.name.length < 1 || lastEp.name.startsWith('Episode')) ? '' : ' "' + lastEp.name + '",'} which aired on ${time
            .utcOffset(1)
            .format('dddd, MMMM Do, h:mm a')} (${moment.duration(moment().diff(time)).format('d [days], h [hours], m [minutes]')} ago).`
        )
      })(episodeData)
    } else {
      ctx.reply('No match, sorry! (Could not find any previous episodes)')
    }
  }
}
/**
 * Gets details on a show. Only the first hit is returned.
 * Also gets the IDs for the same show on other APIs known to TMDB
 *
 * @param {string} query
 * @param {string} [tmdbToken=null]
 * @returns {Promise<Object>}
 */
async function getShowDetails (query, tmdbToken = null) {
  if (!(tmdbToken = tmdbToken || process.env.TMDB_TOKEN)) {
    throw new Error('No API token supplied')
  }

  var json = await fetch(
    `http://api.themoviedb.org/3/search/tv?api_key=${tmdbToken}&query=${query}`
  ).then(res => res.json())

  if (!json.total_results) {
    return 'No hits. Sorry!'
  } else {
    try {
      var show = json.results[0]
      json = await fetch(
        `http://api.themoviedb.org/3/tv/${show.id}?api_key=${
          tmdbToken
        }&append_to_response=external_ids`
      ).then(res => res.json())
      return json
    } catch (e) {
      return 'No match, sorry!'
    }
  }
}

/**
 *
 *
 * @param {string} externalProvider
 * @param {number|string} externalID
 * @returns {Promise<Object>}
 */
async function episodeDataFromTVMaze (externalProvider, externalID) {
  const showDetails = await fetch(
    'http://api.tvmaze.com/lookup/shows?' + externalProvider + '=' + externalID,
    { redirect: 'manual' }
  ).then(res => {
    return fetch(
      // Need some check here to see if the url actually exists
      res.headers.get('location') +
        '?embed[]=nextepisode&embed[]=previousepisode'
    ).then(res => res.json())
  }).catch(() => null)
  return Object.assign({}, showDetails)
}

// Fallback for getting date from TMDB which won't include exact airtime
// async function nextEpisodeFromTMDB () {
// }

module.exports = ApiClient
