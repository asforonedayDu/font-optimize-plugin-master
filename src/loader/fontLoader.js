const LoaderUtiles = require('loader-utils')
const walk = require('../fileSpider')
const path = require('path')
const qs = require('querystring')
const FontMin = require('fontmin')
const RuleSet = require('webpack/lib/RuleSet')
const {save2file, getFileContent} = require('../util/cacheHelper')
const crypto = require('crypto')

// const cachedFileContent = new Map()
const {cacheDir, replaceContentFilePath} = require('../fontSpiderPlugin')

const fontFileInfoMap = new Map()

async function fontTask(fontSource, contents = '', fontFileTarget, originExt, options) {
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
  return matchedOriginOptimizedSource
}

async function runFontMin(fontSource, contents, targetFontTypes) {
  return new Promise((resolve, reject) => {
    const fontmin = new FontMin()
    // fontmin.src('../fsbuild/SourceHanSans-Normal.ttf')
    fontmin.src(fontSource)
    fontmin.use(FontMin.glyph({
      text: contents,
      // hinting: false
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

async function start(source, options, callback) {
  const {optimize, target, originExt} = qs.parse(this.resourceQuery.slice(1))
  const hash = crypto.createHash('md5')
  hash.update(options.spiderDir ? options.spiderDir.join('') : options.extraContents)
  const cacheHashName = hash.digest('hex')
  const replaceContent = getFileContent(replaceContentFilePath + `toReplaceContent-${cacheHashName}.txt`)

  const result = await fontTask.call(this, source, replaceContent, target, originExt, options)
  if (!result) {
    return callback(null, source)
  }
  return callback(null, result)
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
  start.call(this, source, options, callback).then(r => {
  })
}
exports.raw = true
