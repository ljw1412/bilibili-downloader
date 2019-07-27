// 插件ID
const extensionId = chrome.runtime.id
// 获取插件id下的资源地址
const getExtensionURL = chrome.extension.getURL

;(function() {
  parsePlayinfo()
})()

chrome.extension.onMessage.addListener((message, sender) => {
  console.log(message)
})

function sendMessage(action, data) {
  chrome.extension.sendMessage({ action, data })
}

function parsePlayinfo() {
  const playinfo_script = $('script:contains("__playinfo__")')
  if (playinfo_script.length) {
    const jsText = playinfo_script.eq(0).text()
    const vInfo = jsText.substr(jsText.indexOf('{'), jsText.lastIndexOf('}'))
    const playinfo = JSON.parse(vInfo)
    sendMessage('playinfo', playinfo)
  }
}
