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

function copyText(str) {
  var text = $(
    '<textarea style="width: 0;height: 0;" id="copy_tmp">' + str + '</textarea>'
  )
  $('body').append(text)
  text.select()
  document.execCommand('Copy')
  $('#copy_tmp').remove()
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
      safeVideoName() {
        return this.title.replace(/[\\s\\\\\/:\\*\\?\\\"<>\\|]/g, '_')
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
      // 被选中的视频列表
      selectVideoList() {
        return this.videoList.filter(item => item.isActived)
      },
      // 被选中的音频列表
      selectAudioList() {
        return this.audioList.filter(item => item.isActived)
      },
      // 被选中的视频名称
      selectVideoStr() {
        return this.selectVideoList.map(item => item.qualityStr).join(' ')
      },
      // 被选中的音频名称
      selectAudioStr() {
        return this.selectAudioList.map(item => item.qualityStr).join(' ')
      },
      code() {
        if (this.version === 2) {
          const selectList = this.selectVideoList.concat(this.selectAudioList)
          // 合并指令
          let mergeCommand = 'ffmpeg '
          let codeList = selectList.map(({ name, ext, url }) => {
            const tsName = ext ? name.replace(ext, '.ts') : name + '.ts'
            mergeCommand += `-i ${tsName} `
            return `aria2c -c --check-certificate=false --header="Origin: https://www.bilibili.com" --referer="https://www.bilibili.com"  --user-agent="Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.99 Safari/533.4" -o "${name}" -x 16 -s 16 "${url}\nffmpeg -y -i "${name}" -c copy -bsf:v h264_mp4toannexb -f mpegts ${tsName}\n`
          })
          mergeCommand += `-c copy "${this.safeVideoName}.mp4"\n`
          if (selectList.length > 1) codeList.push(mergeCommand)
          return codeList.join('\n')
        }
        return ''
      }
    },
    methods: {
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
      onButtonClick() {
        this.isDisplayPopover = !this.isDisplayPopover
      },
      onSelectAllClick() {
        this.videoList.forEach(item => {
          this.$set(item, 'isActived', true)
        })
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
      },
      onDownloadClick() {
        copyText(this.code)
      }
    }
  })
}
