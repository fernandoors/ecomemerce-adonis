'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const UserTransformer = use('App/Transformers/Admin/UserTransformer')
const ProductTransformer = use('App/Transformers/Admin/ProductTransformer')
const OrderTransformer = use('App/Transformers/Admin/OrderTransformer')

/**
 * CouponTransformer class
 *
 * @class CouponTransformer
 * @constructor
 */
class CouponTransformer extends BumblebeeTransformer {
  static get availableInclude() {
    return ['users', 'products', 'orders']
  }
  /**
   * This method is used to transform the data.
   */
  transform(coupon) {
    coupon = coupon.toJSON()
    delete coupon.created_at
    delete coupon.updated_at
    return coupon
  }
  includeUser(order) {
    return this.collection(order.getRelated('users'), UserTransformer)
  }
  includeProducts(orderItem){
    return this.collection(orderItem.getRelated('products'), ProductTransformer)
  }
  includeOrders(orderItem){
    return this.collection(orderItem.getRelated('orders'), OrderTransformer)
  }
}

module.exports = CouponTransformer
