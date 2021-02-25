'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with coupons
 */
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Coupon = use('App/Models/Coupon')
const Transformer = use('App/Transformers/Admin/CouponTransformer')

const Database = use('Database')
const Service = use('App/Services/Coupon/CouponService')
class CouponController {
  /**
   * Show a list of all coupons.
   * GET coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, pagination, transform }) {
    const code = request.input('code')
    const query = Coupon.query()
    if (!!code) {
      query.where('code', 'LIKE', `%${code}%`)
    }
    let coupons = await query.paginate(pagination.page, pagination.limit)
    coupons = await transform.paginate(coupons, Transformer)
    return response.send(coupons)
  }

  /**
   * Create/save a new coupon.
   * POST coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, transform }) {
    const trx = await Database.beginTransaction()
    const can_use_for = {
      client: false,
      product: false
    }
    try {
      const couponData = request.only([
        'code',
        'valid_from',
        'valid_until',
        'quantity',
        'can_use_for',
        'type',
        'recursive'
      ])
      const { users, products } = request.only(['users', 'products'])
      let coupon = await Coupon.create(couponData, trx)

      const service = new Service(coupon, trx)
      if (users && !!users.length) {
        await service.syncUsers(users)
        can_use_for.client = true
      }
      if (products && !!products.length) {
        await service.syncProducts(products)
        can_use_for.product = true
      }
      if (can_use_for.product && can_use_for.client) {
        coupon.can_use_for = 'product_client'
      } else if (can_use_for.product && !can_use_for.client) {
        coupon.can_use_for = 'product'
      } else if (!can_use_for.product && can_use_for.client) {
        coupon.can_use_for = 'client'
      } else {
        coupon.can_use_for = 'all'
      }
      await coupon.save()
      await trx.commit()
      coupon = await transform.include('users,products').item(coupon, Transformer)
      return response.status(201).send(coupon)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        message: 'Erro ao cadastrar o cupom!'
      })
    }
  }

  /**
   * Display a single coupon.
   * GET coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params: { id }, response, transform }) {
    try {
      let coupon = await Coupon.findOrFail(id)
      coupon = await transform.include('users,products,orders').item(coupon, Transformer)
      return response.send(coupon)
    } catch (error) {
      return response.status(400).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }

  /**
   * Update coupon details.
   * PUT or PATCH coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params: { id }, request, response, transform }) {
    const trx = await Database.beginTransaction()
    const can_use_for = {
      client: false,
      product: false
    }
    try {
      let coupon = await Coupon.findOrFail(id)
      const couponData = request.only([
        'code',
        'valid_from',
        'valid_until',
        'quantity',
        'can_use_for',
        'type',
        'recursive'
      ])
      await coupon.merge(couponData)

      const { users, products } = request.only(['users', 'products'])

      const service = new Service(coupon, trx)
      if (users && !!users.length) {
        await service.syncUsers(users)
        can_use_for.client = true
      }
      if (products && !!products.length) {
        await service.syncProducts(products)
        can_use_for.product = true
      }
      if (can_use_for.product && can_use_for.client) {
        coupon.can_use_for = 'product_client'
      } else if (can_use_for.product && !can_use_for.client) {
        coupon.can_use_for = 'product'
      } else if (!can_use_for.product && can_use_for.client) {
        coupon.can_use_for = 'client'
      } else {
        coupon.can_use_for = 'all'
      }
      await coupon.save(trx)
      await trx.commit()
      coupon = await transform.item(coupon, Transformer)
      return response.status(201).send(coupon)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        message: 'Erro ao cadastrar o cupom!'
      })
    }
  }

  /**
   * Delete a coupon with id.
   * DELETE coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params: { id }, request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const coupon = await Coupon.findOrFail(id)
      await coupon.products().detach([], trx)
      await coupon.orders().detach([], trx)
      await coupon.users().detach([], trx)
      await coupon.delete(trx)
      await trx.commit()
      return response.status(204).send({})
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }
}

module.exports = CouponController
