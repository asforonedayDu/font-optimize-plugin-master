const walk = require('./fileSpider')
const path = require('path')
const pluginName = 'font-simplify'
const cacheKey = `${pluginName}-cacheKey`
const cacheDir = path.resolve(__dirname, '.cache/')
const replaceContentFilePath = path.resolve(__dirname, `.cache/${pluginName}-toReplaceContent`)
const RuleSet = require('webpack/lib/RuleSet')
const qs = require('querystring')
const fs = require('fs')
const {save2file, getFileContent, emptyDir} = require('./util/cacheHelper')

function createMatcher(fakeFile) {
  return (rule, i) => {
    // #1201 we need to skip the `include` check when locating the vue rule
    const clone = Object.assign({}, rule)
    delete clone.include
    const normalized = RuleSet.normalizeRule(clone, {}, '')
    return (
      !rule.enforce &&
      normalized.resource &&
      normalized.resource(fakeFile)
    )
  }
}

class fontSpiderPlugin {
  constructor(option) {
    this.checkOK = false
    this.option = {}
    const supportedExts = ['woff2', 'woff', 'otf', 'ttf', 'eot', 'svg']
    let {spiderDir, optimizeFontNames, optimizeFileTypes = '', outputFontTypes = supportedExts, extraContents = ''} = option
    if (!extraContents instanceof String) {
      console.log('fontSpiderPlugin: option.extraContents must be type of String')
      return
    }
    this.option.extraContents = extraContents
    if (!spiderDir || spiderDir.length === 0) {
      console.log('fontSpiderPlugin: option.spiderDir can\'t be null')
      return
    }
    this.option.spiderDir = spiderDir instanceof Array ? spiderDir : [spiderDir]
    // if (!optimizeFontNames) {
    //   console.log('fontSpiderPlugin: optimizeFontNames can\'t be null')
    //   return
    // }
    this.option.optimizeFontNames = optimizeFontNames instanceof Array ? optimizeFontNames : (optimizeFontNames ? [optimizeFontNames] : [])
    // if (!optimizeFileTypes) {
    //   console.log('fontSpiderPlugin: optimizeFileTypes can\'t be null')
    //   return
    // }
    this.option.optimizeFileTypes = (optimizeFileTypes instanceof Array) ? optimizeFileTypes.join('|') : optimizeFileTypes
    const filter = fontExt => supportedExts.includes(fontExt)
    this.option.outputFileTypes = ((outputFontTypes instanceof Array) ? outputFontTypes : outputFontTypes.split('|')).filter(filter)
    if (this.option.outputFileTypes.length === 0) {
      console.log('fontSpiderPlugin: outputFontTypes can\'t be null')
      return
    }
    this.checkOK = true
  }

  apply(compiler) {
    if (!this.checkOK) {
      return
    }
    this.getContent(compiler).then()
    // use webpack's RuleSet utility to normalize user rules
    const rawRules = compiler.options.module.rules
    const {rules} = new RuleSet(rawRules)
    const isPostcssLoader = l => /(\/|\\|@)postcss-loader/.test(l.loader)
    const isCssLoader = l => /(\/|\\|@)css-loader/.test(l.loader)
    const cssLoader = {
      loader: require.resolve('./loader/cssLoader'),
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

    const fontLoader = {
      loader: require.resolve('./loader/fontLoader'),
      resource: {
        test: resource => {
          const ok = /\.ttf|eot|otf|woff|woff2|svg$/.test(resource)
          return ok
        }
      },
      enforce: 'pre',
      options: {
        ...this.option,
        extraContents: ''
      }
    }

    // replace original rules
    compiler.options.module.rules = [
      fontLoader,
      ...rules
    ]
    compiler.hooks.thisCompilation.tap(pluginName, (compilation, callback) => {

      compilation.hooks.normalModuleLoader.tap(`${pluginName} loader`, (loaderContext, module) => {
        function insertLoader(module) {
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
    })

  }

  async getContent(compiler) {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir)
    } else {
      emptyDir(cacheDir)
    }
    const {spiderDir, optimizeFileTypes, extraContents} = this.option
    let fontContent = ''
    for (const _dir of spiderDir) {
      const dir = path.resolve(_dir)
      const content = await walk(dir, optimizeFileTypes)
      fontContent += content
    }
    fontContent += extraContents
    fontContent = [...new Set(fontContent.split(''))].join('')
    console.log(`在你的源码中我们找到了${fontContent.length}个汉字`)
    save2file(replaceContentFilePath, fontContent)
    return fontContent
  }

}

// fontSpiderPlugin.loader = require('./cssLoader')
module.exports = fontSpiderPlugin
module.exports.cacheDir = cacheDir
module.exports.cacheKey = cacheKey
module.exports.replaceContentFilePath = replaceContentFilePath
