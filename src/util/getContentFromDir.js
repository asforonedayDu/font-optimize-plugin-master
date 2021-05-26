const walk = require('../fileSpider')
const path = require('path')

const getContent = async function ({spiderDir = [], optimizeFileTypes = ''}) {
  spiderDir = spiderDir instanceof Array ? spiderDir : [spiderDir]
  optimizeFileTypes = (optimizeFileTypes instanceof Array) ? optimizeFileTypes.join('|') : optimizeFileTypes
  let fontContent = ''
  for (const _dir of spiderDir) {
    const dir = path.resolve(_dir)
    try {
      const content = await walk(dir, optimizeFileTypes)
      fontContent += content
    } catch (e) {
      console.log(`路径读取错误 路径${dir}`)
    }
  }
  return fontContent
}

module.exports = getContent
