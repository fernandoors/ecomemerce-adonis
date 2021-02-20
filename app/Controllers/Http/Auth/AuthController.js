'use strict'
'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class AuthController {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async register({ request, response }) {
  }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async login({ request, response, auth }) { }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async refresh({ request, response, auth }) { }

  /**
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async logout({ request, response, auth }) { }

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
