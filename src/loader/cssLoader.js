const loaderUtils = require('loader-utils')
const qs = require('querystring')
const path = require('path')
const { cacheDir, replaceContentFilePath } = require('../fontSpiderPlugin')
const crypto = require('crypto')
const LoaderUtiles = require('loader-utils')

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

function getReg (optimizeFontNames) {
  let regName
  if (optimizeFontNames && optimizeFontNames.length > 0) {
    regName = optimizeFontNames.reduce((all = '', item) => {
      return `${all && `${all}|`}${item}`
    })
  } else {
    regName = `[^\\\\|/]+?`
  }
  // return new RegExp(`(\\/|\\\\|^)(${regName})\\.(eot|ttf|woff|woff2|otf|svg)`, 'i')
  return new RegExp(`url\\(.(([^\\)]+?(\\/|\\\\))(${regName})\\.(eot|ttf|woff|woff2|otf|svg)).\\)`, 'i')
}

function generateNewFontUrl (fullPath, contextPath, fontName, ext, outputFileTypes) {
  const hash = crypto.createHash('md5')
  hash.update(fullPath)
  const cacheHashName = hash.digest('hex')
  let result = []
  outputFileTypes.forEach((type, index) => {
    let formatType
    switch (type) {
      case 'eot':
        formatType = fontName ? 'format(\'embedded-opentype\')' : ''
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
        if (ext !== 'otf') return
        // formatType = 'format(\'OpenType\')'
        break
      case 'svg':
        formatType = 'format(\'svg\')'
        break
    }
    if (type === ext) {
      result.push(`url(\'${fullPath}?hashName=${cacheHashName}\') ${formatType}`)
    } else {
      let cacheDir = LoaderUtiles.stringifyRequest(this, `${demoFontDir}${path.sep}font-optimized.${type}`)
      cacheDir = cacheDir.replace(/\"|\'/g, '')
      result.push(`url(\'${cacheDir}?hashName=${cacheHashName}&&originType=${ext}&&fontType=${type}\') ${formatType}`)
    }

  })
  return result.join(',')
}

function generateNewSource (formatContent) {
  let result = Object.keys(formatContent).map(key => {
    if (key === 'src') {
      return formatContent.src.map(urlContent => {
        return `src:${urlContent}`
      }).join(';')
    } else {
      return `${key}:${formatContent[key]}`
    }
  })
  return result.join(';')
}

function start (source) {
  const options = loaderUtils.getOptions(this)

  const fontFaceReg = /(@font-face *\{([^}]+?)\})/isg
  let regResult = fontFaceReg.exec(source)
  while (regResult) {
    const originContent = regResult[0]
    const fontContent = regResult[2]

    const contentReg = getReg(options.optimizeFontNames)
    if (!contentReg.exec(fontContent)) {
      regResult = fontFaceReg.exec(source)
      continue
    }

    const formatContent = toObj(fontContent)
    // result = content.match(/src:url\(([^\)]+?)\)/is)
    if (formatContent['font-family'] && formatContent.src.length > 0) {

      let i = 0, fullPath, contextPath, fontName, ext
      const newFontSrc = []
      while (i < formatContent.src.length) {
        const srcContent = formatContent.src[i]
        const regResult = srcContent.match(contentReg)
        if (regResult) {
          ext = regResult[5]
          if (/otf|ttf|svg/.test(ext)) {
            fullPath = regResult[1]
            contextPath = regResult[2]
            fontName = regResult[4]
            const types = options.outputFileTypes
            types.push(ext)
            newFontSrc.push(generateNewFontUrl.call(this, fullPath, contextPath, fontName, ext, [...new Set(types)]))
            break
          }
        }
        i++
      }
      if (newFontSrc.length > 0) {
        if (options.outputFileTypes.includes('eot')) {
          newFontSrc.unshift(generateNewFontUrl.call(this, fullPath, '', '', ext, ['eot']))
        }
        formatContent.src = newFontSrc
        const replaceContent = generateNewSource(formatContent)
        source = source.replace(originContent, `@font-face {${replaceContent};}`)
      }

    }
    regResult = fontFaceReg.exec(source)
  }
  return source
}

module.exports = function (source) {

  return start.call(this, source)
  // return
}
