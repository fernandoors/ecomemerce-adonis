'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')

/**
 * ImageTransformer class
 *
 * @class ImageTransformer
 * @constructor
 */
class ImageTransformer extends BumblebeeTransformer {
  /**
   * This method is used to transform the data.
   */
  transform(model) {
    const image = model.toJSON()
    return {
      id: image.id,
      url: image.url,
      size: image.size,
      original_name: image.original_name,
      extation: image.extation,
    }
  }
}

module.exports = ImageTransformer
