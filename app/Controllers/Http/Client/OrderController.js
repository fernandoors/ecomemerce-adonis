'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with orders
 */
const Database = use('Database')
const Ws = use('Ws')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Order = use('App/Models/Order')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Coupon = use('App/Models/Coupon')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Discount = use('App/Models/Discount')
const Transformer = use('App/Transformers/Admin/OrderTransformer')
const Service = use('App/Service/Order/OrderService')

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
  async index({ request, response, pagination, transform, auth }) {
    const client = await auth.getUser()
    const { number } = request.only(['number'])
    const query = Order.query()
    if (!!number) {
      query.where('id', 'LIKE', `%${number}%`)
    }
    query.where('user_id', client.id)
    let orders = await query.orderBy('id', 'DESC').paginate(pagination.page, pagination.limit)
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
  async store({ request, response, auth, transform }) {
    const trx = await Database.beginTransaction()
    try {
      const items = request.input('items')
      const client = await auth.getUser()
      let order = await Order.create({ user_id: client.id, trx })
      const service = new Service(order, trx)
      if (!!items.length) {
        await service.syncItems(items)
      }
      await trx.commit()
      order = await Order.find(order.id)
      order = await transform.includes('items').item(order, Transformer)
      const topic = Ws.getChannel('notifications').topic('notifications')
      if (topic) {
        topic.broadcast('new:order', order)
      }
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
    const client = await auth.getUser()
    const result = await Order.query().where('user_id', client.id).where('id', id).firstOrFail()
    const order = await transform.item(result, Transformer)
    return response.send(order)
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params: { id }, request, auth, response }) {
    const client = await auth.getUser()
    let order = await Order.query().where('user_id', client.id).where('id', id).firstOrFail()
    const trx = Database.beginTransaction()
    try {
      const { items, status } = request.all()
      order.merge({ user_id: client.id, status })
      const service = new Service(order, trx)
      await service.updateItems(items)
      await order.save(trx)
      await trx.commit()
      order = await transform.includes('items,coupons,discounts').item(order, Transformer)
      return response.send(order)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }

  }
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async applyDiscount({ params: { id }, request, response, transform, auth }) {
    const { code } = request.all()
    const coupon = await Coupon.findByOrFail('code', code.toUpperCase())
    const client = await auth.getUser()
    let order = await Order.query().where('user_id', client.id).where('id', id).firstOrFail()
    let info = {}
    try {
      const service = new Service(order)
      const canAddDiscount = await service.canApplyDiscount(coupon)
      const orderDiscounts = await order.coupons().getCount()
      const canApplyToOrder = orderDiscounts < 1 || (!!orderDiscounts && coupon.recursive)
      if (canAddDiscount && canApplyToOrder) {
        await Discount.findOrCreate({
          order_id: order.id,
          coupon_id: coupon.id,
        })
        info.message = 'Cupom aplicado com sucesso!'
        info.success = true
      } else {
        info.message = 'Erro ao aplicar o cupom!'
        info.success = false
      }
      order = await transform.include('coupons,items,discounts').item(order, Transformer)
      return response.send({ order, info })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao processar a sua solicitação!'
      })
    }
  }
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async removeDiscount({ params: { id }, request, response, auth }) {
    const client = await auth.getUser()
    const { discount_id } = request.all()
    await Order.query().where('user_id', client.id).where('id', id).firstOrFail()
    const discount = await Discount.findOrFail(discount_id)
    await discount.delete()
    return response.status(204).send({})
  }
}

module.exports = OrderController
