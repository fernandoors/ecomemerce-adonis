'use strict'

const Database = use('Database')
class OrderService {
  constructor(model, trx = false) {
    this.model = model
    this.trx = trx
  }
  async syncItems(items) {
    if (!Array.isArray(items)) {
      return false
    }
    await this.model.items().delete(this.trx)
    await this.model.items().createMany(items, this.trx)
  }
  async updateItems(items) {
    const currentItems = await this.model
      .items()
      .whereIn('id', items.map(item => item.id))
      .fetch()
    await this.model
      .items()
      .whereNotIn('id', items.map(item => item.id))
      .delete(this.trx)

    await Promise.all(currentItems.row.map(async item => {
      item.fill(items.find(content => content.id === item.id))
      await item.save(this.trx)
    }))
  }

  async canApplyDiscount(coupon) {
    const now = new Date().getTime()
    if (now > coupon.valid_from.getTime() || (typeof coupon.valid_until === 'object' && coupon.valid_until.getTime() < now)) {
      return false
    }
    const couponProducts = await Database.from('coupon_products').where('coupon_id', coupon.id).pluck('product_id')
    const couponClients = await Database.from('coupon_user').where('coupon_id', coupon.id).pluck('user_id')

    if (Array.isArray(couponProducts) && !couponProducts.length && Array.isArray(couponClients) && !couponClients.length) {
      return true
    }
    const isAssociatedToProduct = Array.isArray(couponProducts) && !!couponProducts.length
    const isAssociatedToClients = Array.isArray(couponClients) && !!couponClients.length

    const productMatch = await Database
      .from('order_items')
      .where('order_id', this.model.id)
      .whereIn('product_id', couponProducts)
      .pluck('product_id')
    if (isAssociatedToClients && isAssociatedToProduct) {
      const clientMatch = couponClients.find(client => client === this.model.user_id)
      if (!!clientMatch && Array.isArray(productMatch) && !!productMatch.length) {
        return true
      }
    }
    if (isAssociatedToProduct && Array.isArray(productMatch) && !!productMatch.length) {
      return true
    }
    if (isAssociatedToClients && Array.isArray(couponClients) && !!couponClients.length) {
      const match = couponClients.find(client => client === this.model.user_id)
      if (!!match) {
        return true
      }
    }
    return false
  }
}

module.exports = OrderService
