import Bilibili from './bilibili'
const bilibili = new Bilibili()
;(function() {
  bilibili.init()
})()

chrome.extension.onMessage.addListener(
  (message: bilibili.ProcessedData, sender: chrome.runtime.MessageSender) => {
    console.log('video-parser:', message)
    bilibili.setData(message)
  }
)
