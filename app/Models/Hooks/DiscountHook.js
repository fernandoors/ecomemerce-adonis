'use strict'
const Database = use('Database')
const Coupon = use('App/Models/Coupon')
const Order = use('App/Models/Order')

const DiscountHook = exports = module.exports = {}

DiscountHook.calculateValues = async (model) => {
  let couponProducts, discountItems = []
  model.discount = 0
  const coupon = await Coupon.find(model.coupon_id)
  const order = await Order.find(model.order_id)
  if (coupon.can_use_for === 'product_client' || coupon.can_use_for === 'product') {
    couponProducts = await Database.from('coupon_product')
      .where('coupon_id', model.coupon_id)
      .pluck('coupon_id')
    discountItems = await Database.from('order_items')
      .where('order_id', model.order_id)
      .whereIn('product_id', couponProducts)
    if (coupon.type == 'percent') {
      for (const orderItem of discountItems) {
        model.discount += (orderItem.subtotal / 100) * coupon.discount
      }
    } else if (coupon.type == 'currency') {
      for (const orderItem of discountItems) {
        model.discount += orderItem.quantity * coupon.discount
      }
    } else {
      for (const orderItem of discountItems) {
        model.discount += orderItem.subtotal
      }
    }
    break;
  } else {
    if (coupon.type === 'percent') {
      model.discount = (orderItem.subtotal / 100) * coupon.discount
    }
    else if (coupon.type == 'currency') {
      model.discount = coupon.discount
    } else {
      model.discount = coupon.subtotal
    }
    break;
  }
  return model
}

DiscountHook.decrementCoupons = async model => {
  const query = Database.from('coupons')
  if (!!model.$transaction) {
    query.$transaction(model.$transaction)
  }
  await query.where('id', model.coupon_id).decrement('quantity', 1)
}

DiscountHook.incrementCoupons = async model => {
  const query = Database.from('coupons')
  if (!!model.$transaction) {
    query.$transaction(model.$transaction)
  }
  await query.where('id', model.coupon_id).increment('quantity', 1)
}
