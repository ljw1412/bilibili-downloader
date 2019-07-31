export function formatDuration(duration: number) {
  const list = [
    Math.floor(duration / 3600) % 24,
    ('0' + (Math.floor(duration / 60) % 60)).substr(-2),
    ('0' + Math.floor(duration % 60)).substr(-2)
  ]
  let isStart = false
  return list
    .filter(item => {
      if (item > 0) isStart = true
      return isStart
    })
    .join(':')
}

export function formatFileSize(size: number) {
  const unitList = ['B', 'KB', 'MB', 'GB', 'PB']
  let i = 0
  while (size / 1024 > 1) {
    size /= 1024
    i++
  }
  return size.toFixed(2) + unitList[i]
}

export function getFileName(url: string) {
  var str = url.split('?') //url按？分开
  str = str[0].split('/') //按/分开
  return str[str.length - 1].toLowerCase() //得到带后缀的名字
}
