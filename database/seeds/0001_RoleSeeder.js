'use strict'

const Role = use('Role')

class RoleSeeder {
  async run() {
    await Role.create({
      name: 'Admin',
      slug: 'admin',
      description: 'Administrator',
    })
    await Role.create({
      name: 'Manager',
      slug: 'manager',
      description: 'Store Manager',
    })
    await Role.create({
      name: 'Customer',
      slug: 'customer',
      description: 'Store Customer',
    })
  }
}

module.exports = RoleSeeder
