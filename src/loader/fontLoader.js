const LoaderUtiles = require('loader-utils')
const walk = require('../fileSpider')
const path = require('path')
const qs = require('querystring')
const FontMin = require('fontmin')
const RuleSet = require('webpack/lib/RuleSet')
const { save2file, getFileContent } = require('../util/cacheHelper')
const { commonCharacter7000, commonCharacter3000 } = require('../util/commonUsedChinese')
const { md5Content } = require('../util/utils')

// const cachedFileContent = new Map()
const { cacheDir, replaceContentFilePath } = require('../fontSpiderPlugin')

async function fontTask (fontSource, contents = '', fontFileTarget, originExt, options) {
  let files
  try {
    files = await runFontMin(fontSource, contents, [fontFileTarget])
  } catch (e) {
    console.log('error while runFontMin:', options.spiderDir, e)
    return
  }
  // 当前字体文件  file.extname: '.ttf'
  let matchedOriginOptimizedSource = null
  files.forEach((file, index) => {
    if (file.extname.toLowerCase() === `.${fontFileTarget.toLowerCase()}`) matchedOriginOptimizedSource = file.contents
    // save2file(path.resolve(cacheDir, `${cacheName}${file.extname}`), file.contents, null)
  })
  if (!matchedOriginOptimizedSource) {
    return false
  }
  // console.log('origin name width', targetFilePath, fontSource.length, 'output new files length:', files[resolveIndex].contents.length)
  // 缓存数据
  const fileName = generateCacheName(fontSource, contents, fontFileTarget)
  save2file(cacheDir + fileName, matchedOriginOptimizedSource, '')
  return matchedOriginOptimizedSource
}

function generateCacheName (fontSource, contents = '', fontFileTarget) {
  return `${md5Content(`${md5Content(fontSource)}-${md5Content(contents)}-${md5Content(fontFileTarget)}`)}.${fontFileTarget}`
}

async function runFontMin (fontSource, contents, targetFontTypes) {
  return new Promise((resolve, reject) => {
    const fontmin = new FontMin()
    // fontmin.src('../fsbuild/SourceHanSans-Normal.ttf')
    fontmin.src(fontSource)
    fontmin.use(FontMin.glyph({
      text: contents,
      // hinting : false
    }))
    const sequence = ['ttf', 'eot', 'svg', 'woff', 'woff2'].filter(i => targetFontTypes.includes(i))
    sequence.forEach(ext => {
      switch (ext) {
        case 'eot':
          fontmin.use(FontMin.ttf2eot())
          break
        case 'ttf':
          fontmin.use(FontMin.otf2ttf())
          fontmin.use(FontMin.svg2ttf())
          break
        // case 'otf': //font-min不支持生成otf文件
        //   fontmin.use(FontMin.otf2ttf())
        //   break
        case 'woff':
          fontmin.use(FontMin.ttf2woff())
          break
        case 'woff2':
          fontmin.use(FontMin.ttf2woff2())
          break
        case 'svg':
          fontmin.use(FontMin.ttf2svg())
          // fontmin.use(svgo());
          break
      }
    })
    // fontmin.dest('../build/fonts')
    fontmin.run((err, files, stream) => {
      if (err) {
        throw err
      }
      resolve(files)
    })
  })
}

async function start (source, options, callback) {
  const { optimize, target, originExt, key = '' } = qs.parse(this.resourceQuery.slice(1))
  const replaceContent = options.extraContents || commonCharacter3000
  const fileName = generateCacheName(source, replaceContent, target)
  let result = getFileContent(cacheDir + fileName, '')
  if (!result) {
    result = await fontTask.call(this, source, replaceContent, target, originExt, options)
    if (!result) {
      return callback(null, source)
    }
  }
  return callback(null, result)
}

exports.default = function (source, arg2 = {}) {
  const callback = this.async()
  const options = LoaderUtiles.getOptions(this)
  start.call(this, source, options, callback).then(r => {
  })
}
exports.raw = true
