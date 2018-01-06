const { Composer } = require('telegraf')

class AnyCase {
/**
 * Applies anycasing to a bot of type Telegraf or Composer for all commands
 *
 * @static
 * @param {(Telegraf|Composer)} bot The bot to modify
 * @returns {(Telegraf|Composer)} The modified bot
 * @memberof AnyCase
 */
  static apply (bot) {
    // Force all commands to be lowercase
    bot.command = function (commands, ...fns) {
      commands = Array.isArray(commands)
        ? commands.map((command) => command.toLowerCase())
        : commands.toLowerCase()
      return this.use(Composer.command(commands, ...fns))
    }

    // Force all incoming commands to be lowercase also
    bot.use(Composer.entity('bot_command',
      (ctx, next) => {
        const entity = ctx.message.entities.find(entity => entity.offset === 0 && entity.type === 'bot_command')
        const command = ctx.message.text.substring(entity.offset, entity.offset + entity.length)
        ctx.message.text = ctx.message.text.split(command).join(command.toLowerCase())
        return next(ctx)
      }))
    return bot
  }
}

module.exports = AnyCase
