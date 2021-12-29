// 【文件过滤器】

export const ALL_FILE_FILTERS = [
  { name: '所有文件', extensions: ['*'] }
]

export const JSON_FILE_FILTERS = [
  { name: 'JSON文件', extensions: ['json'] },
  ...ALL_FILE_FILTERS
]
