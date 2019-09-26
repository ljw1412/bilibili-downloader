// 插件ID
const extensionId = chrome.runtime.id
// 获取插件id下的资源地址
const getExtensionURL = chrome.extension.getURL

;(function() {
  addview()
})()

chrome.extension.onMessage.addListener((message, sender) => {
  console.log('video-parser:', message)
  getTitle()
  app.setData(message)
})

function sendMessage(action, data) {
  chrome.extension.sendMessage({ action, data })
}

function getTitle() {
  const title = $('.media-wrapper h1').text() || $('.video-title .tit').text()
  if ($('#multi_page').length && $('.list-box').length) {
    const subTitle = $('.list-box li.on a').attr('title')
    if (subTitle) title += subTitle
  }
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

function isFetchProgressSupported() {
  return (
    typeof Response !== 'undefined' && typeof ReadableStream !== 'undefined'
  )
}
// fetch 进度条功能
const fetchProgress = ({
  defaultSize = 0,
  onProgress = () => {}
}) => response => {
  if (!isFetchProgressSupported()) {
    return response
  }
  const { body, headers } = response

  const reader = body.getReader()
  const contentLength = headers.get('content-length') || defaultSize
  let bytesReceived = 0
  let progress = 0

  return new Promise((resolve, reject) => {
    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.close()
                onProgress(1)
                resolve(new Response(stream, { headers }))
              }
              if (value) {
                bytesReceived += value.length

                if (contentLength) {
                  progress = bytesReceived / contentLength
                }
                onProgress(progress)
              }
              controller.enqueue(value)
              push()
            })
            .catch(err => {
              reject(err)
            })
        }
        push()
      }
    })
  })
}

function bindVue() {
  app = new Vue({
    el: '#video-parser',
    data() {
      return {
        isDisplayPopover: false,
        data: {},
        title: '',
        message: '',
        isDisplayToast: false,
        messageTimer: null
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
      // 下载完成的视频列表
      downloadedVideoList() {
        return this.videoList.filter(item => item.isDownloaded)
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
        // if (this.version === 2) {
        const selectList = this.selectVideoList.concat(this.selectAudioList)
        const tsNameList = []
        // 合并指令
        let mergeCommand = 'ffmpeg '
        let codeList = selectList.map(({ name, ext, url }) => {
          const tsName = ext ? name.replace(ext, '.ts') : name + '.ts'
          tsNameList.push(tsName)
          mergeCommand += `-i ${tsName} `
          return `aria2c -c --check-certificate=false --header="Origin: https://www.bilibili.com" --referer="https://www.bilibili.com"  --user-agent="Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.99 Safari/533.4" -o "${name}" -x 16 -s 16 "${url}"\r\nffmpeg -y -i "${name}" -c copy -bsf:v h264_mp4toannexb -f mpegts ${tsName}\r\n`
        })
        mergeCommand += `-c copy "${this.safeVideoName}.mp4"\r\n`
        if (this.version === 1) {
          const tsListStr = tsNameList.join('|')
          mergeCommand = `ffmpeg -i "concat:${tsListStr}" -c copy "${
            this.safeVideoName
          }.mp4"\n`
        }
        if (selectList.length > 1) codeList.push(mergeCommand)
        return codeList.join('\r\n')
        // }
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
              item.isDownloading = false
              item.isDownloaded = false
              item.isFail = false
              item.progress = ''
              item.blob = null
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
      // 显示消息气泡
      showToast(msg) {
        this.message = msg
        this.isDisplayToast = true
        if (this.messageTimer) clearTimeout(this.messageTimer)
        this.messageTimer = setTimeout(() => {
          this.isDisplayToast = false
          this.messageTimer = null
        }, 3000)
      },
      // 开始下载
      download(list, onComplete = () => {}) {
        list.forEach(video => {
          if (video.isDownloading || (video.isDownloaded && video.blob)) return
          video.isDownloading = true
          fetch(video.url.replace(/^https?/, 'https'), {
            method: 'GET',
            headers: {},
            mode: 'cors',
            cache: 'default',
            referrerPolicy: 'no-referrer-when-downgrade'
          })
            .then(
              fetchProgress({
                defaultSize: video.bytes || 0,
                onProgress: progress => {
                  if (progress > 1) progress = 1
                  video.progress = progress * 100
                }
              })
            )
            .then(response => response.blob())
            .then(blob => {
              onComplete(blob, video)
              video.isDownloading = false
            })
            .catch(error => {
              console.error(error)
              this.showToast('下载出错了/(ㄒoㄒ)/~~')
              video.isFail = true
              video.isDownloading = false
            })
        })
      },
      // 点击合并下载
      onMergeDownloadClick() {
        this.download(this.videoList, (blob, video) => {
          video.blob = blob
          video.isDownloaded = true
        })
      },
      // 点击选择下载
      onDownloadClick() {
        if (!this.selectAudioList.length && !this.selectVideoList.length) {
          this.showToast('请选择需要下载的片段')
          return
        }
        if (this.version === 1) {
          this.download(this.selectVideoList, (blob, video) => {
            saveAs(blob, video.name)
          })
        } else if (this.version === 2) {
          copyText(this.code)
          this.showToast('下载指令已经复制到剪贴板！')
        }
      }
    },
    watch: {
      downloadedVideoList(list) {
        if (list.length === 0) return
        if (list.length === this.videoList.length) {
          this.showToast('正在合并中，请稍后……')
          FLV.mergeBlobs(list.map(item => item.blob)).then(mergeBlob => {
            saveAs(mergeBlob, this.safeVideoName + list[0].ext)
            this.showToast('合并完成！请慢用(｡･ω･｡)')
          })
        }
      }
    }
  })
}

// TODO: bilibili Comic.
// const getHashKey = (episodeId, seasonId) => {
//   const u8Array = new Uint8Array(new ArrayBuffer(8))
//   u8Array[0] = episodeId
//   u8Array[1] = episodeId >> 8
//   u8Array[2] = episodeId >> 16
//   u8Array[3] = episodeId >> 24
//   u8Array[4] = seasonId
//   u8Array[5] = seasonId >> 8
//   u8Array[6] = seasonId >> 16
//   u8Array[7] = seasonId >> 24
//   return u8Array
// }

// unhashContent = function() {
//   for (var t = 0, e = indexData.length; t < e; t++)
//     indexData[t] = indexData[t] ^ hashKey[t % 8]
// }

// str = atob(
//   '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'
// )

// var arr = []
// for (var i = 0, j = str.length; i < j; ++i) {
//   arr[i] = str.charCodeAt(i)
// }
// uint = new Uint8Array(arr)
