const walk = require('./fileSpider')
const path = require('path')
const pluginName = 'font-simplify'
const cacheKey = `${pluginName}-cacheKey`
const cacheDir = path.resolve(__dirname, '.cache/') + path.sep
const replaceContentFilePath = path.resolve(__dirname, `.cache/`) + path.sep
const RuleSet = require('webpack/lib/RuleSet')
const qs = require('querystring')
const fs = require('fs')
const { save2file, getFileContent, emptyDir } = require('./util/cacheHelper')
const getContent = require('./util/getContentFromDir')
const { md5Content } = require('./util/utils')
const crypto = require('crypto')

class fontSpiderPlugin {
  constructor (option) {
    this.checkOK = false
    this.option = {}
    // const supportedExts = ['woff2', 'woff', 'otf', 'ttf', 'eot', 'svg']
    let { spiderDir = [], optimizeFileTypes = '', extraContents = '', key = '' } = option
    if (!extraContents instanceof String) {
      console.log('fontSpiderPlugin: option.extraContents must be type of String')
      return
    }
    this.option.extraContents = extraContents
    this.option.key = `${key}`
    this.option.spiderDir = spiderDir instanceof Array ? spiderDir : [spiderDir]
    this.option.optimizeFileTypes = (optimizeFileTypes instanceof Array) ? optimizeFileTypes.join('|') : optimizeFileTypes
    // const filter = fontExt => supportedExts.includes(fontExt)
    // const toLowerCase = fontExt => fontExt.toLowerCase()
    // if (this.option.spiderDir.length > 0 || extraContents) {
    //   this.checkOK = true
    // }
    this.checkOK = true
  }

  apply (compiler) {
    if (!this.checkOK) {
      return
    }
    const fontLoaderPath = require.resolve('./loader/fontLoader')
    const cssLoaderPath = require.resolve('./loader/cssLoader')
    const rawRules = compiler.options.module.rules
    let firstLoadPlugin = !rawRules.find(item => {
      return item.loader === fontLoaderPath
    })
    // use webpack's RuleSet utility to normalize user rules
    const { rules } = new RuleSet(rawRules)

    const fontLoader = {
      loader: fontLoaderPath,
      resourceQuery: query => {
        const parsed = qs.parse(query.slice(1))
        if (parsed.optimize != null && /^((woff2)|(woff)|(ttf)|(eot)|(svg))$/i.test(parsed.target)) {
          if (this.option.key || parsed.key) {
            return parsed.key === this.option.key
          }
          return true
        }
        return false
      },
      enforce: 'pre',
      options: {
        ...this.option,
        // extraContents: ''
      }
    }
    // replace original rules
    compiler.options.module.rules = [
      fontLoader,
      ...rules
    ]
    // 只有第一次运行的时候需要添加CSS loader
    if (!firstLoadPlugin) {
      return
    }
    const cssLoader = {
      loader: cssLoaderPath,
      // resource: {
      //   test: resource => {
      //     const ok = /\.(css|less|scss|sass)$/.test(resource)
      //     if (ok) {
      //       return ok
      //     }
      //     return true
      //   }
      // },
      // enforce: 'pre',
      options: {
        ...this.option,
        extraContents: ''
      }
    }
    compiler.hooks.thisCompilation.tap(pluginName, (compilation, callback) => {

      compilation.hooks.normalModuleLoader.tap(`${pluginName} loader`, (loaderContext, module) => {
        const isPostcssLoader = l => /(\/|\\|@)postcss-loader/.test(l.loader)
        const isCssLoader = l => /(\/|\\|@)css-loader/.test(l.loader)

        function insertLoader (module) {
          const loaders = module.loaders
          if (loaders.findIndex(l => l.loader === cssLoader.loader) > -1) return
          let i = loaders.findIndex(isPostcssLoader)
          if (i === -1) i = loaders.findIndex(isCssLoader)
          if (i > -1) {
            const preLoaders = loaders.slice(0, i)
            const postLoaders = loaders.slice(i)

            module.loaders = [
              ...preLoaders,
              cssLoader,
              ...postLoaders
            ]
          }
        }

        if (/\.vue\?/.test(module.resource) && qs.parse(module.resource).type === 'style') {
          insertLoader(module)
        } else if (/\.(css|less|scss|sass)$/.test(module.resource)) {
          insertLoader(module)
        }
        return module
      })

      // compilation.mainTemplate.hooks.assetPath.tap(`${pluginName} loader`, (path, options, assetInfo) => {
      //   if (/huakanglijinheiW8/.test(path)) {
      //
      //     return path
      //   }
      //   const mm = arguments
      //   return path
      // })
      // compilation.hooks.chunkAsset.tap(`${pluginName} loader`, (chunk, filename) => {
      //
      //   const mm = arguments
      //   return arguments
      // })
      // compilation.hooks.afterOptimizeModules.tap(`${pluginName} loader`, (modules) => {
      //
      //   const mm = modules
      //   return modules
      // })
    })
    // this.getContentAndSave(compiler).then()
  }

  async getContentAndSave (compiler) {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir)
    } else {
      emptyDir(cacheDir)
    }
    const { extraContents } = this.option
    let spiderContent = ''
    if (this.option.spiderDir) {
      spiderContent = await getContent({
        spiderDir: this.option.spiderDir,
        optimizeFileTypes: this.option.optimizeFileTypes
      })
    }
    let fontContent = extraContents + spiderContent
    fontContent = [...new Set(fontContent.split(''))].join('')
    console.log(` ${fontContent.length} characters were found in specified dirs with extraContents. `)

    const cacheHashName = md5Content(this.option.spiderDir ? this.option.spiderDir.join('') : extraContents)

    save2file(replaceContentFilePath + `toReplaceContent-${cacheHashName}.txt`, fontContent)
    return fontContent
  }

}

// fontSpiderPlugin.loader = require('./cssLoader')
module.exports = fontSpiderPlugin
module.exports.cacheDir = cacheDir
module.exports.cacheKey = cacheKey
module.exports.replaceContentFilePath = replaceContentFilePath
