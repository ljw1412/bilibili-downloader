// 插件ID
const extensionId = chrome.runtime.id
// 获取插件id下的资源地址
const getExtensionURL = chrome.extension.getURL

;(function() {
  addview()
})()

chrome.extension.onMessage.addListener((message, sender) => {
  getTitle()
  app.setData(message)
})

function sendMessage(action, data) {
  chrome.extension.sendMessage({ action, data })
}

function getTitle() {
  const title = $('.media-wrapper h1').text() || $('.video-title .tit').text()
  app.setTitle(title)
}

/**
 * 解析本地视频信息并发送给背景页
 */
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
        parsePlayinfo()
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
        data: {},
        title: ''
      }
    },
    computed: {
      videoName() {
        return this.title
      },
      version() {
        return this.data.version
      },
      videoList() {
        return this.data.videoList || []
      },
      audioList() {
        return this.data.audioList || []
      },
      selectVideoList() {
        return this.videoList.filter(item => item.isActived)
      },
      selectAudioList() {
        return this.audioList.filter(item => item.isActived)
      },
      selectVideoStr() {
        return this.selectVideoList.map(item => item.qualityStr)
      },
      selectAudioStr() {
        return this.selectAudioList.map(item => item.qualityStr)
      },
    },
    methods: {
      onButtonClick() {
        this.isDisplayPopover = !this.isDisplayPopover
      },
      setTitle(title) {
        this.title = title
      },
      setData({ action, data }) {
        if (action === 'list') {
          if (data.version === 1) {
            data.videoList.forEach(item => {
              item.qualityStr = '分段' + item.order
            })
          }
          this.data = data
        }
      },
      onItemClick(item, list) {
        if (this.version === 2) {
          const isActived = item.isActived
          list.forEach(item => {
            this.$set(item, 'isActived', false)
          })
          item.isActived = isActived
        }
        this.$set(item, 'isActived', !item.isActived)
      }
    }
  })
}
