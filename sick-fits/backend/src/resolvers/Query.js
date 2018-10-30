const { forwardTo } = require('prisma-binding')
const { hasPermission } = require('../utils')

const Query = {

  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      return null
    }
    return ctx.db.query.user({
      where: { id: ctx.request.userId },
    }, info)
  },
  async users(parent, args, ctx, info) {
    // Check if the user is logged in
    if (!ctx.request.userId) throw new Error('User not logged in!')
    // Check if the user has permission to do this query
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])

    return ctx.db.query.users({}, info)
  },

  // Longhanded way - forward if there's no additional logic to be done
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items()
  //   return items
  // },
}

module.exports = Query
