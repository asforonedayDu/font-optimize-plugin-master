const postcss = require('postcss')

function run (root, result) {
  // // get configured option
  // const options = getConfiguredOptions(initialOptions || {});
  // // set the custom foundry
  // const foundries = {
  //   ...initialFoundries,
  //   custom: options.custom
  // };
  console.log('font-optimize-vue-plugin-master post css plugin run')
  // return the plugin
}

module.exports = postcss.plugin('font-optimize-postcss-plugin', function () {
  const args = arguments
  return run
})


