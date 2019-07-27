// 插件ID
const extensionId = chrome.runtime.id
// 获取插件id下的资源地址
const getExtensionURL = chrome.extension.getURL

;(function() {
  parsePlayinfo()
  addview()
})()

chrome.extension.onMessage.addListener((message, sender) => {
  console.log(message)
  app.setData(message)
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

let app

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
        bindVue()
      }
    }
  )
}

function bindVue() {
  app = new Vue({
    el: '#video-parser',
    data() {
      return {
        isDisplayPopover: false,
        data: {}
      }
    },
    methods: {
      onButtonClick() {
        this.isDisplayPopover = !this.isDisplayPopover
      },
      setData(data) {
        this.data = data
      }
    }
  })
}
