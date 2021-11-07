// 【工具函数】
import { readFile, writeFile } from 'fs'

// 加载文件
// - @path 文件路径
// - @encoding 文件编码
// - @return 文件内容（失败时为null）
export async function loadFile (path, encoding = 'utf8') {
  return new Promise(resolve => {
    readFile(path, { encoding }, (err, data) => {
      if (err) {
        console.error(err)
        resolve(null)
      } else {
        resolve(data)
      }
    })
  })
}

// 保存文件
// - @path 文件路径
// - @data 文件数据
// - @encoding 文件编码
// - @return 是否成功
export async function saveFile (path, data, encoding = 'utf8') {
  return new Promise(resolve => {
    writeFile(path, data, { encoding }, err => {
      if (err) {
        console.error(err)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

export default {
  loadFile,
  saveFile
}
