'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Database = use('Database')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Role = use('Role')
class AuthController {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async register({ request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const { email, password, name, surname } = request.all()
      const user = await User.create({ email, password, name, surname }, trx)
      const userRole = await Role.findBy('slug', 'customer')
      await user.roles().attach([userRole.id], null, trx)

      await trx.commit()
      return response.status(201).send({ data: user })
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        message: 'Erro ao realizar cadastro!'
      })
    }
  }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async login({ request, response, auth }) {
    const { email, password } = request.all()
    const data = await auth.withRefreshToken().attempt(email, password)
    return response.send({ data })
  }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async refresh({ request, response, auth }) {
    let refresh_token = request.input('refresh_token')
    if (!refresh_token) {
      refresh_token = request.header('refresh_token')
    }
    const user = await auth.newRefreshToken().generateForRefreshToken(refresh_token)

    return response.send({ data: user })
  }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async logout({ request, response, auth }) {
    let refresh_token = request.input('refresh_token')
    if (!refresh_token) {
      refresh_token = request.header('refresh_token')
    }
    await auth.authenticator('jwt').revokeTokens([refresh_token], true)
    return response.status(204)
  }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async forgot({ request, response }) { }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async remember({ request, response }) { }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async reset({ request, response }) { }
}

module.exports = AuthController
