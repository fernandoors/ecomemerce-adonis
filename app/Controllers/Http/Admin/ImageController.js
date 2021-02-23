'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with images
 */
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Image = use('App/Models/Image')

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use('Helpers')
const { manage_single_upload, manage_multiple_upload } = use('App/Helpers')
const fs = use('fs')
const Transformer = use('App/Transformers/Admin/ImageTransformer')

class ImageController {
  /**
   * Show a list of all images.
   * GET images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ response, pagination, transform }) {
    let images = await Image
      .query().orderBy('id', 'DESC')
      .paginate(pagination.page, pagination.limit)
    images = await transform.paginate(images, Transformer)
    return response.send(images)
  }

  /**
   * Create/save a new image.
   * POST images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, transform }) {
    try {
      const fileJar = request.file('images', {
        types: ['image'],
        size: '2mb'
      })

      let files = { error: null }
      const images = []
      if (!fileJar.files) {
        files = await manage_single_upload(fileJar)
        if (files.moved()) {
          const image = await Image.create({
            path: files.fileName,
            size: files.size,
            original_name: files.clientName,
            extation: files.subtype
          })
          const transformedImage = await transform.item(image, Transformer)
          images.push(transformedImage)
        } else {
          return response.status(400).send({ message: 'Não foi possível processar esta imagem no momento!' })
        }
      } else {
        files = await manage_multiple_upload(fileJar)
        files.successes.map(async file => {
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extation: file.subtype
          })
          const transformedImage = await transform.item(image, Transformer)
          images.push(transformedImage)
        })
      }
      return response.status(201).send({ successes: images, error: files.errors })
    } catch (error) {
      return response.status(400).send({ message: 'Não foi possível processar esta imagem no momento!' })
    }
  }

  /**
   * Display a single image.
   * GET images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params: { id }, response, transform }) {
    try {
      let image = await Image.findOrFail(id)
      image = await transform.item(image, Transformer)
      return response.send(image)
    } catch (error) {
      return response.status(400).send({ message: 'Não foi possível atualizar esta imagem no momento!' })
    }
  }

  /**
   * Update image details.
   * PUT or PATCH images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params: { id }, request, response, transform }) {
    try {
      let image = await Image.findOrFail(id)
      image.merge({ original_name: request.only(['original_name']) })
      await image.save()
      image = await transform.item(image, Transformer)
      return response.status(image)
    } catch (error) {
      return response.status(400).send({ message: 'Não foi possível atualizar esta imagem no momento!' })
    }
  }

  /**
   * Delete a image with id.
   * DELETE images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params: { id }, response }) {
    try {
      const image = await Image.findOrFail(id)
      const filePath = Helpers.publicPath(`uploads/${image.path}`)

      fs.unlinkSync(filePath)
      await image.delete()
      return response.status(204).send({})
    } catch (error) {
      return response.status(400).send({ message: 'Não foi possível atualizar esta operação no momento!' })
    }
  }
}

module.exports = ImageController
