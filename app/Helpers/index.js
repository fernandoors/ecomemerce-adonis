'use stric'

const crypto = use('crypto')

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use('Helpers')

/**
 * Create a string with random characters
 * @param { int } length
 * @return { string }
 */
const str_random = async (length = 40) => {
  let string = ''
  const len = string.length
  if (len < length) {
    const size = length - len
    const bytes = await crypto.randomBytes(size)
    const buffer = Buffer.from(bytes)
    string += buffer.toString('base64').replace(/[^a-zA-Z0-9]/g, '').substr(0, size)
  }
  return string
}

/**
 * Save a new file in local path
 * @param { FileJar } file
 * @param { string } path
 * @return { Object<FileJar> }
 */
const manage_single_upload = async (file, path = null) => {
  const random_name = await str_random(30)
  const fileName = `${new Date().getTime()}-${random_name}.${file.subtype}`
  await file.move(path, {
    name: fileName
  })
  return file
}


/**
 * Save new files in local path
 * @param { FileJar } fileJar
 * @param { string } path
 * @return { Object }
 */
const manage_multiple_upload = async (fileJar, path = null) => {
  path = !!path ? path : Helpers.publicPath('uploads')

  const successes = [], errors = []

  await Promise.all(fileJar.files.map(async file => {
    const random_name = await str_random(30)
    const fileName = `${new Date().getTime()}-${random_name}.${file.subtype}`
    await file.move(path, {
      name: fileName
    })
    if (file.moved()) {
      successes.push(file)
    } else {
      errors.push(file.errors)
    }
  }))

  return { successes, errors }
}

module.exports = {
  str_random,
  manage_single_upload,
  manage_multiple_upload
}
