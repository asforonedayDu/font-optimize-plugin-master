const LoaderUtiles = require('loader-utils')
const walk = require('../fileSpider')
const path = require('path')
const qs = require('querystring')
const FontMin = require('fontmin')
const RuleSet = require('webpack/lib/RuleSet')
const { save2file, getFileContent } = require('../util/cacheHelper')
const crypto = require('crypto')

// const cachedFileContent = new Map()
const { cacheDir, replaceContentFilePath } = require('../fontSpiderPlugin')

const fontFileInfoMap = new Map()

async function fontTask (fontSource, contents = '', fontFileTarget, outputFileTypes, callback) {
  const { ext: originExt, fullPath: targetFilePath, name } = fontFileTarget

  const cacheName = fontFileTarget.hashName

  // const generatorFileTypes = outputFileTypes.filter(ext => ext !== targetExt)
  let files
  try {
    files = await runFontMin(fontSource, contents, outputFileTypes)
  } catch (e) {
    console.log('error while runFontMin:', targetFilePath, e)
    callback(e, fontSource)
    return
  }
  // 当前字体文件  file.extname: '.ttf'
  let matchedOriginOptimizedSource = null
  files.forEach((file, index) => {
    if (file.extname === `.${originExt}`) matchedOriginOptimizedSource = file.contents
    save2file(path.resolve(cacheDir, `${cacheName}${file.extname}`), file.contents, null)
  })
  if (!matchedOriginOptimizedSource) {
    matchedOriginOptimizedSource = fontSource
  }
  // console.log('origin name width', targetFilePath, fontSource.length, 'output new files length:', files[resolveIndex].contents.length)

  callback(null, matchedOriginOptimizedSource)
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
  return new RegExp(`(\\/|\\\\|^)(${regName})\\.(eot|ttf|woff|woff2|otf)$`, 'i')
}

async function runFontMin (fontSource, contents, outputFileTypes) {
  return new Promise((resolve, reject) => {
    const fontmin = new FontMin()
    // fontmin.src('../fsbuild/SourceHanSans-Normal.ttf')
    fontmin.src(fontSource)
    fontmin.use(FontMin.glyph({
      text: contents,
      // hinting: false
    }))
    const sequence = ['ttf', 'eot', 'svg', 'woff', 'woff2'].filter(i => outputFileTypes.includes(i))
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

async function start (options, source, callback) {
  const { hashName, originPath, originType, fontType } = qs.parse(this.resourceQuery.slice(1))
  if (hashName && originType && fontType) {
    const cachedPath = path.resolve(cacheDir, `${hashName}.${fontType}`)
    const start = new Date().getTime()
    const waitContent = setInterval(() => {
      const cachedFile = getFileContent(cachedPath, null)
      if (cachedFile) {
        clearInterval(waitContent)
        callback(null, cachedFile)
        return
      }
      if (new Date().getTime() - start > 1000 * 20) {
        console.log('获取字体文件超时', hashName, originType, fontType)
        clearInterval(waitContent)
        callback(null, source)
      }
    }, 1000)
  } else if (hashName) {
    const reg = getReg(options.optimizeFontNames)
    const regResult = reg.exec(this.resourcePath)
    if (!regResult) {
      callback(null, source)
      return
    }
    const item = {
      fullPath: this.resourcePath + this.resourceQuery,
      name: regResult[2],
      ext: regResult[3],
      hashName
    }
    const contents = getFileContent(replaceContentFilePath)
    fontTask.call(this, source, contents, item, options.outputFileTypes, callback).then()
  } else {
    return callback(null, source)
  }
}

exports.default = function (source) {
  // this._module.reasons.forEach(({ module, dependency }) => {
  //   if (!module) {
  //     console.log('missing module in reason')
  //     return
  //   }
  //   this._compilation.moduleTemplates.javascript.hooks.content.tap(pluginName,
  //     (moduleSource, module, options, dependencyTemplates) => {
  //       let cssModule = null
  //       for (let dependency of module.dependencies) {
  //         if (dependency.module && dependency.module === this._module) {
  //           cssModule = module
  //           break
  //         }
  //       }
  //       if (cssModule) {
  //
  //       }
  //     })
  // })
  const callback = this.async()
  const options = LoaderUtiles.getOptions(this)
  start.call(this, options, source, callback).then(r => {
  })
}
exports.raw = true
