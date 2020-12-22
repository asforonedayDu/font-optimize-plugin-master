const fs = require('fs'),
  path = require('path');



function filterStr(str) {
  const s = new Set(Array.from(str));
  return Array.from(s).join('')
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
}


