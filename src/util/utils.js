const fs = require('fs'),
  path = require('path')
const crypto = require('crypto')

function parserQuery(str = '') {
  const query = {}
  let url = ''
  const splitArray = str.replace(/\?\?/g, '?').split('?')
  if (splitArray.length === 1) {
    return {
      url: splitArray[0],
      query
    }
  }
  url = splitArray[0]
  const ext = url.match(/\.([^\.]+?)$/i) ? url.match(/\.([^\.]+?)$/i)[1] : ''
  const splitQuery = splitArray[1].replace(/&&/g, '&').split('&')
  splitQuery.forEach(item => {
    const keyValue = item.split('=')
    query[keyValue[0]] = keyValue.length > 1 ? keyValue[1] : ''
  })
  return {
    query,
    ext,
    url
  }
}

function filterStr(str) {
  const s = new Set(Array.from(str))
  return Array.from(s).join('')
}

function md5Content(content) {
  const hash = crypto.createHash('md5')
  hash.update(content)
  return hash.digest('hex')
}

// const resolve = this['_compiler'].resolverFactory.get('normal')
// resolve.resolve(
//   {
//     issuer:this.resourcePath,
//   },
//   this.context,
//   fullPath,
//   {},
//   (err, resource, resourceResolveData) => {
//     if (err) return callback(err)
//     callback(null, {
//       resourceResolveData,
//       resource
//     })
//   }
// )

module.exports = {
  filterStr,
  parserQuery,
  md5Content,
}


