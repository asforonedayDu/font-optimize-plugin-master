const fs = require('fs')
const path = require('path')

function getFileContent (path, charSet = 'utf8') {
  if (!fs.existsSync(path)) {
    return ''
  }
  return fs.readFileSync(path, charSet)
}

function save2file (fullPath, content, charSet = 'utf8') {
  if (!fullPath) return false
  // if (callback) {
  //   fs.readFile(path, function (err, data) {
  //     if (err) {
  //       callback(new Error(err.toString()))
  //     }
  //     callback(charSet ? data.toString(charSet) : data)
  //   })
  // } else {
  //   return new Promise((resolve, reject) => {
  //     fs.readFile(path, function (err, data) {
  //       if (err) {
  //         reject(new Error(err.toString()))
  //       }
  //       resolve(charSet ? data.toString(charSet) : data)
  //     })
  //   })
  // }
  if (fs.existsSync(fullPath)) {
    deleteFile(fullPath)
  }
  //调用fs.writeFile() 进行文件写入
  return fs.writeFileSync(fullPath, content, charSet)
}

function deleteFile (fullPath) {
  if (!getFileContent(fullPath)) {
    return 'ok'
  }
  return fs.unlinkSync(fullPath)
}

function emptyDir (dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath)
    files.forEach(function (file, index) {
      const curPath = path.resolve(dirPath, file)
      if (fs.statSync(curPath).isDirectory()) { // recurse
        emptyDir(curPath)
      } else { // delete file
        fs.unlinkSync(curPath)
      }
    })
    // fs.unlinkSync(dirPath)
  }
  return true
}

module.exports = {
  getFileContent,
  save2file,
  emptyDir,
  deleteFile
}
