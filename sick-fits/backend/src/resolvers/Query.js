const { forwardTo } = require('prisma-binding')

const Query = {

  items: forwardTo('db'),
  item: forwardTo('db'),

  // Longhanded way - forward if there's no additional logic to be done
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items()
  //   return items
  // },
}

module.exports = Query
