const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { promisify } = require('util')
const { transport, createEmail } = require('../mail')
const { hasPermission } = require('../utils')

const Mutations = {
  async createItem(parent, args, ctx, info) {
    if (!ctx.request.userId) throw new Error('You must be logged in to create an item!')
    const item = await ctx.db.mutation.createItem({
      data: {
        // Creating a relationship between the user and the item
        user: {
          connect: {
            id: ctx.request.userId,
          },
        },
        ...args,
      },
    }, info)

    return item
  },
  updateItem(parent, args, ctx, info) {
    const updates = { ...args }
    delete updates.id
    return ctx.db.mutation.updateItem({
      data: updates,
      where: {
        id: args.id,
      },
    }, info)
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id }
    // Find the item
    const item = await ctx.db.query.item({ where }, `{
      id
      title
      user {id}
    }`)
    // Check if they own the item or have perms
    const ownsItem = item.user.id === ctx.request.userId
    const hasPermissions = ctx.request.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission))
    if (!ownsItem || !hasPermission) throw new Error('You don\'t have permission')
    // Delete it
    return ctx.db.mutation.deleteItem({ where }, info)
  },
  async signup(parent, args, ctx, info) {
    const email = args.email.toLowerCase()
    const password = await bcrypt.hash(args.password, 10)
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        email,
        permissions: { set: ['USER'] },
      },
    }, info)
    // CREATE JWT TOKEN
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    // SET TOKEN AS COOKIE
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    })
    return user
  },
  async signin(parent, { email, password }, ctx, info) {
    const user = await ctx.db.query.user({ where: { email } })
    if (!user) throw new Error('Email or password is incorrect')
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new Error('Email or password is incorrect')
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    })
    return user
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token')
    return { message: 'Goodbye!' }
  },
  async requestReset(parent, args, ctx, info) {
    // Check if real user
    const user = await ctx.db.query.user({ where: { email: args.email } })
    if (!user) throw new Error('No such user found')
    // Set reset token
    const resetToken = (await promisify(randomBytes)(20)).toString('hex')
    const resetTokenExpiry = Date.now() + 3600000

    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    })

    const mailRes = await transport.sendMail({
      from: 'sick-fits@sick-fits.com',
      to: user.email,
      subject: 'Reset Your Sick-Fits Password',
      html: createEmail(`Your password reset token is here! \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}"> Click here to reset!</a>`),
    })

    return { message: 'Thanks' }
    // Email them the reset token
  },
  async resetPassword(parent, { password, confirmPassword, resetToken }, ctx, info) {
    // Check if the passwords match
    if (password !== confirmPassword) throw new Error('Passwords don\'t match!')
    // Check if reset token is legit

    // Check the token isn't expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    })
    if (!user) {
      throw new Error('Token is invalid or has expired')
    }
    // Has the new password
    const newPassword = await bcrypt.hash(password, 10)

    // Save the new password and delete token
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })
    // Generate new cookie
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET)
    // Set new cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    })
    // Return User
    return updatedUser
  },
  async updatePermissions(parent, args, ctx, info) {
    if (!ctx.request.userId) throw new Error('You must be logged in')
    const currentUser = await ctx.db.query.user({
      where: {
        id: ctx.request.userId,
      },
    }, info)
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE'])
    return ctx.db.mutation.updateUser({
      data: {
        permissions: {
          set: args.permissions,
        },
      },
      where: {
        id: args.userId,
      },
    }, info)
  },
}
module.exports = Mutations
