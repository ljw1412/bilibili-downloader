import Bilibili from './bilibili/index'

const loaders = [{ test: /bilibili.com/, Loader: Bilibili }]

const port = chrome.extension.connect({ name: 'video-parse' })
;(function() {
  loaders.forEach(item => {
    if (!item.test.test(location.href)) return
    new item.Loader(port)
  })
})()
