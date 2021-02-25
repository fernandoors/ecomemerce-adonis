'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const UserTransformer = use('App/Transformers/Admin/UserTransformer')
const OrderItemTransformer = use('App/Transformers/Admin/OrderItemTransformer')
const CouponTransformer = use('App/Transformers/Admin/CouponTransformer')

/**
 * OrderTransformer class
 *
 * @class OrderTransformer
 * @constructor
 */
class OrderTransformer extends BumblebeeTransformer {
  static get availableInclude() {
    return ['user', 'coupon', 'items', 'discounts']
  }
  /**
   * This method is used to transform the data.
   */
  transform(order) {
    order = order.JSON()
    return {
      id: order.id,
      status: order.status,
      total: !!order.total ? parseFloat(order.total.toFixed(2)) : 0,
      date: order.created_at,
      qty_items: order.__meta__ && order.__meta__.qty_items ? order.__meta__.qty_items : 0,
      discount: order.__meta__ && order.__meta__.discount ? order.__meta__.discount : 0,
      subtotal: order.__meta__ && order.__meta__.subtotal ? order.__meta__.subtotal : 0,
    }
  }
  includeUser(order) {
    return this.item(order.getRelated('user'), UserTransformer)
  }
  includeCoupons(order) {
    return this.item(order.getRelated('coupon'), CouponTransformer)
  }
  includeItems(order) {
    return this.collection(order.getRelated('items'), OrderItemTransformer)
  }
  includeDiscounts(order) {
    return this.item(order.getRelated('discounts'), UserTransformer)
  }
}

module.exports = OrderTransformer
