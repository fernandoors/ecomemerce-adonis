'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.group(() => {

  Route.get('products', 'ProductController.index')
  Route.get('products/:id', 'ProductController.show')

  Route.get('orders', 'OrderController.get').middleware(['auth'])
  Route.get('orders/:id', 'OrderController.show').middleware(['auth'])
  Route.post('orders', 'OrderController.store').middleware(['auth'])
  Route.put('orders/:id', 'OrderController.put').middleware(['auth'])
  Route.put('orders/:id/discount', 'OrderController.applyDiscount').middleware(['auth'])
  Route.delete('orders/:id', 'OrderController.removeDiscount').middleware(['auth'])

}).prefix('v1').namespace('Client')
