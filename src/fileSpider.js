const fs = require('fs'),
  path = require('path');
const {filterStr} = require('./util/utils')


/**
 * filter Chinese characters
 * @param {string} str
 */
function getChineseChr(str) {
  const matched = str.match(/[^\x00-\x7F]/g);
  return matched ? filterStr(matched) : ''
}


/**
 * Walk through all files in `dir`
 * @param {string} dir
 * @param fileTypes
 */
function walk(dir, fileTypes = null) {
  const fileExtReg = new RegExp(`^\.${fileTypes}`, 'i')

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dir)) {
      return reject(new Error('路径不存在' + dir.toString()));
    }
    fs.readdir(dir, (error, files) => {
      if (error) {
        return reject(error);
      }
      Promise.all(files.map((file) => {
        return new Promise((resolve, reject) => {
          const filepath = path.join(dir, file);
          fs.stat(filepath, (error, stats) => {
            if (error) {
              return reject(error);
            }
            if (stats.isDirectory()) {
              walk(filepath, fileTypes).then(resolve);
            } else if (stats.isFile()) {
              // resolve(filepath);
              const ext = path.extname(filepath)
              if (!fileTypes || fileExtReg.test(ext)) {
                fs.readFile(filepath, {
                  encoding: 'utf8'
                }, (err, content) => {
                  if (err || typeof content !== 'string') {
                    console.error(err)
                    reject(err)
                    return
                  }
                  resolve(getChineseChr(content))
                })
              } else {
                resolve('')
              }
            }
          });
        });
      }))
      .then(
        /**
         * @param {string[]} foldersContents
         */
        (foldersContents) => {
          resolve(foldersContents
            .reduce((all, folderContents) => all + folderContents, '')
          );
        });
    });
  });
}

module.exports = walk
