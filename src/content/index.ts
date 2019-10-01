import Bilibili from './bilibili'

// 插件ID
const extensionId = chrome.runtime.id
// 获取插件id下的资源地址
const getExtensionURL = chrome.extension.getURL
;(function() {
  addview()
})()

chrome.extension.onMessage.addListener(
  (message: bilibili.ProcessedData, sender: chrome.runtime.MessageSender) => {
    console.log('video-parser:', message)
    bilibili.setData(message)
  }
)

function sendMessage(action: string, data: any) {
  chrome.extension.sendMessage({ action, data })
}

let bilibili: Bilibili
function addview() {
  $('body').append('<div id="video-parser"></div>')
  const cssURL = getExtensionURL('css/downloadView.css')
  $('#video-parser').before(
    `<link  rel="stylesheet" type="text/css" href="${cssURL}"/>`
  )
  $('#video-parser').load(
    getExtensionURL('template/downloadView.html'),
    (resonse, status, xhr) => {
      if (status === 'success') {
        console.log('添加下载界面成功！')
        bilibili = new Bilibili('#video-parser')
        bilibili.parsePlayinfo(sendMessage)
      }
    }
  )
}
