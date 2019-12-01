import Bilibili from './bilibili'
import BilibiliComic from './bilibili/comic'

let bilibili: Bilibili | BilibiliComic
if (location.href.includes('manga.bilibili.com/detail')) {
  bilibili = new BilibiliComic()
} else {
  bilibili = new Bilibili()
}
;(function() {
  bilibili.init()
})()

chrome.extension.onMessage.addListener(
  (message: bilibili.ProcessedData, sender: chrome.runtime.MessageSender) => {
    console.log('video-parser:', message)
    bilibili.setData(message)
  }
)
