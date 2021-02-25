'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with orders
 */
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Order = use('App/Models/Order')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Coupon = use('App/Models/Coupon')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Discount = use('App/Models/Discount')
const Database = use('Database')
const Service = use('App/Service/Order/OrderService')
const Transformer = use('App/Transformers/Admin/OrderTransformer')

class OrderController {
  /**
   * Show a list of all orders.
   * GET orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, pagination, transform }) {
    const { status, id } = request.only(['status', 'id'])
    const query = Order.query()
    if (!!status && !!id) {
      query.where('status', status)
      query.orWhere('id', 'LIKE', `%${id}%`)
    } else if (!!status) {
      query.where('status', status)
    } else if (!id) {
      query.where('id', 'LIKE', `%${id}%`)
    }
    let orders = await query.paginate(pagination.page, pagination.limit)
    orders = await transform.paginate(orders, Transformer)
    return response.send(orders)
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, transform }) {
    const trx = await Database.beginTransaction()
    try {
      const { user_id, items, status } = request.all()
      let order = await Order.create({ user_id, status }, trx)
      const service = new Service(order, trx)
      if (!!items && !!items.length) {
        await service.syncItems(items)
      }
      await trx.commit()
      order = await Order.find(order.id)
      order = await transform.include('user,items').item(order, Transformer)
      return response.status(201).send(order)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }

  /**
   * Display a single order.
   * GET orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params: { id }, response, transform }) {
    try {
      let order = await Order.findOrFail(id)
      order = await transform.include('user,items,discounts').item(order, Transformer)
      return response.send(order)
    } catch (error) {
      return response.status(400).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params: { id }, request, response, transform }) {
    const trx = await Database.beginTransaction()
    try {
      let order = await Order.findOrFail(id)
      const { user_id, status } = request.all()

      order.merge({ user_id, status })

      const service = new Service(order, trx)

      await service.updateItems(items)
      await order.save()
      await trx.commit()

      order = await transform.include('user,items,discounts,coupons').item(order, Transformer)
      return response.send(order)
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }

  /**
   * Delete a order with id.
   * DELETE orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params: { id }, response }) {
    const trx = await Database.beginTransaction()
    try {
      const order = await Order.findOrFail(id)
      await order.items().delete(trx)
      await order.coupons().delete(trx)
      await order.delete(trx)
      await trx.commit()
      return response.status(204).send({})
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }

  async applyDiscount({ params: { id }, request, response }) {
    const { code } = request.all()
    const coupon = await Coupon.findByOrFail('code', code.toUpperCase())
    const order = await Order.findByOrFail(id)

    const info = {}

    try {
      const service = new Service(order)
      const canAddDiscount = await service.canApplyDiscount(coupon)
      const orderDiscounts = await order.coupons().getCount()
      const canApplyToOrder = orderDiscounts < 1 || (!!orderDiscounts && !!coupon.recursive)

      if (!!canAddDiscount && !!canApplyToOrder) {
        await Discount.findOrCreate({
          order_id: order.id,
          coupon_id: coupon.id
        })
        info.message = 'Cupom aplicado com sucesso!'
        info.success = true
      } else {
        info.message = 'Não foi possível aplicar o Cupom!'
        info.success = false
      }
      return response.send({ order, info })
    } catch (error) {
      return response.status(400).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }
  async removedDiscount({ request, response }) {
    try {
      const { discount_id } = request.all()
      const discount = await Discount.findOrFail(discount_id)
      await discount.delete()
      return response.status(204).send({})
    } catch (error) {
      return response.status(400).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }
}

module.exports = OrderController
