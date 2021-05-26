const loaderUtils = require('loader-utils')
const qs = require('querystring')
const path = require('path')
// const { cacheDir, replaceContentFilePath } = require('../fontSpiderPlugin')
const crypto = require('crypto')
const LoaderUtils = require('loader-utils')
const {parserQuery} = require('../util/utils')

const demoFontDir = path.resolve(__dirname, '../fake-font/')

const toObj = function (content) {
  const result = {
    'font-family': undefined,
    src: []
  }
  const properties = content.split(';')
  properties.forEach(property => {
    if (property) {
      const keyValues = property.split(':')
      if (keyValues.length > 1) {
        const key = keyValues[0].trim()
        if (key === 'src') {
          result.src.push(keyValues[1].trim())
        } else {
          result[key] = keyValues[1]
        }
      }
    }
  })
  return result
}

function generateNewFontUrl(url, query, fontType, originExt) {
  // const hash = crypto.createHash('md5')
  // hash.update(fullPath)
  // const cacheHashName = hash.digest('hex')
  let result = []
  let formatType = ''
  switch (fontType.toLowerCase()) {
    case 'eot':
      formatType = 'format(\'embedded-opentype\')'
      break
    case 'ttf':
      formatType = 'format(\'truetype\')'
      break
    case 'woff':
      formatType = 'format(\'woff\')'
      break
    case 'woff2':
      formatType = 'format(\'woff2\')'
      break
    case 'otf':   // font-min不支持生成OTF格式字体文件
      // if (ext !== 'otf') return
      formatType = 'format(\'OpenType\')'
      break
    case 'svg':
      formatType = 'format(\'svg\')'
      break
  }
  const newQuery = {
    ...query,
    target: fontType,
    originExt
  }
  const queryStr = Object.keys(newQuery).map(key => {
    return `${key}=${newQuery[key]}`
  }).join('&')
  return `url(\'${url}?${queryStr}\') ${formatType}`
  // if (type === ext) {
  // } else {
  //   let cacheDir = LoaderUtiles.stringifyRequest(this, `${demoFontDir}${path.sep}font-optimized.${type}`)
  //   cacheDir = cacheDir.replace(/\"|\'/g, '')
  //   result.push(`url(\'${cacheDir}?hashName=${cacheHashName}&&originType=${ext}&&fontType=${type}\') ${formatType}`)
  // }
  // return result.join(',')
}

function start(callback, source, map, meta) {
  const options = loaderUtils.getOptions(this)
  if (!meta) {
    return callback(null, ...Array.prototype.slice.call(arguments, 1))
  }
  const rootCss = meta.ast.root
  // for each font face rule
  rootCss.walkAtRules('font-face', rule => {
    rule.walkDecls('src', decl => {
      // set the font family
      const urlBody = decl.value.replace(/^(['"])(.+)\1$/g, '$2')
      const arrayUrl = urlBody.split(',').filter(str => {
        return /url\([^\)]+?\)/i.test(str)
      })
      if (arrayUrl) {
        const resultArray = []
        arrayUrl.forEach((urlBody, index) => {
          const fullUrl = /url\((?:'|")([^\)]+?)(?:'|")\)/i.exec(urlBody)[1]
          const {query, url, ext} = parserQuery(fullUrl)
          if (query.optimize !== null && typeof query.target === 'string') {
            const targetFonts = query.target.split('|')
            if (targetFonts.length > 1) {
              targetFonts.forEach(fontType => {
                resultArray.push(generateNewFontUrl(url, query, fontType, ext))
              })
            } else {
              resultArray.push(urlBody)
            }
          } else {
            resultArray.push(urlBody)
          }
        })
        decl.value = resultArray.join(',')
      }
    })
  })
  return callback(null, rootCss.toString(), map, meta)
}

module.exports = function () {
  const cb = this.async()
  return start.call(this, cb, ...arguments)
}
