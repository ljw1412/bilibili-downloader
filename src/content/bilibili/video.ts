import Vue from 'vue'
import { saveAs } from 'file-saver'
import FLV from './Flv'
import { getExtensionURL, copyText, fetchProgress, xhr } from '../utils'
import * as logger from '../../utils/logger'

const buildMsg = (msg: Record<string, any>) => {
  return Object.assign({ website: 'bilibili', type: 'video' }, msg)
}

export default class BilibiliVideo {
  app: any
  port!: chrome.runtime.Port
  titleObserver: MutationObserver
  state = { loadedFullScreenListener: false, loadedCheckViewListener: false }

  constructor(port: chrome.runtime.Port) {
    this.port = port
    this.addListener()
    this.initVue()
    this.addview()
  }

  initVue() {
    const that = this
    this.app = new Vue({
      data() {
        return {
          isDisplayPopover: false,
          data: {},
          title: '',
          message: '',
          isDisplayToast: false,
          messageTimer: null,
          isFullScreen: false,
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
          return this.videoList.filter(
            (item: bilibili.OutMedia) => item.isActived
          )
        },
        // 被选中的音频列表
        selectAudioList() {
          return this.audioList.filter(
            (item: bilibili.OutMedia) => item.isActived
          )
        },
        // 下载完成的视频列表
        downloadedVideoList() {
          return this.videoList.filter(
            (item: bilibili.OutMedia) => item.isDownloaded
          )
        },
        // 被选中的视频名称
        selectVideoStr() {
          return this.selectVideoList
            .map((item: bilibili.OutMedia) => item.qualityStr)
            .join(' ')
        },
        // 被选中的音频名称
        selectAudioStr() {
          return this.selectAudioList
            .map((item: bilibili.OutMedia) => item.qualityStr)
            .join(' ')
        },
        code() {
          // if (this.version === 2) {
          const selectList: bilibili.OutMedia[] = this.selectVideoList.concat(
            this.selectAudioList
          )
          const tsNameList: string[] = []
          const delCodeList: string[] = []

          // 合并指令
          let mergeCommand = 'ffmpeg '
          let codeList = selectList.map(({ name, ext, url }) => {
            const tsName = ext ? name.replace(ext, '.ts') : name + '.ts'
            tsNameList.push(tsName)
            delCodeList.push(`del ${tsName}`)
            delCodeList.push(`del ${name}`)
            mergeCommand += `-i ${tsName} `
            return `aria2c -c --check-certificate=false --header="Origin: https://www.bilibili.com" --referer="https://www.bilibili.com"  --user-agent="Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.99 Safari/533.4" -o "${name}" -x 16 -s 16 "${url}"\r\nffmpeg -y -i "${name}" -c copy -bsf:v h264_mp4toannexb -f mpegts ${tsName}\r\n`
          })
          mergeCommand += `-c copy "${this.safeVideoName}.mp4"\r\n`
          if (this.version === 1) {
            const tsListStr = tsNameList.join('|')
            mergeCommand = `ffmpeg -i "concat:${tsListStr}" -c copy "${this.safeVideoName}.mp4"\n`
          }
          if (selectList.length > 1) {
            codeList.push(mergeCommand)
            // codeList.push('echo "按任意键删除临时文件！！！！！"\r\npause')
            codeList.push(delCodeList.join('\r\n'))
          }
          return 'chcp 65001\r\n' + codeList.join('\r\n') + '\r\n'
        },
      },
      methods: {
        setTitle(title: string) {
          this.title = title
        },
        setData({ action, data }: bilibili.ProcessedMessage) {
          if (['list', 'cache_list'].includes(action)) {
            if (data.version === 1) {
              data.videoList.forEach((item) => {
                item.qualityStr = '分段' + item.order
                item.isDownloading = false
                item.isDownloaded = false
                item.isFail = false
                item.progress = ''
                item.blob = null
              })
            }
            data.videoList.forEach((item) => {
              item.isActived = false
            })
            data.audioList.forEach((item) => {
              item.isActived = false
            })
            this.data = data
          }
        },
        onButtonClick() {
          if (!this.isDisplayPopover) {
            if (this.title.includes('銀魂（僅限港澳台地區）：01-02 ')) {
              this.setTitle(that.getTitle())
            }
          }
          this.isDisplayPopover = !this.isDisplayPopover
        },
        onSelectAllClick() {
          this.videoList.forEach((item: bilibili.OutMedia) => {
            item.isActived = true
          })
        },
        onItemClick(item: bilibili.OutMedia, list: bilibili.OutMedia[]) {
          if (this.version === 2) {
            const isActived = item.isActived
            list.forEach((item) => {
              this.$set(item, 'isActived', false)
            })
            item.isActived = isActived
          }
          this.$set(item, 'isActived', !item.isActived)
        },
        // 显示消息气泡
        showToast(msg: string) {
          this.message = msg
          this.isDisplayToast = true
          if (this.messageTimer) clearTimeout(this.messageTimer)
          this.messageTimer = setTimeout(() => {
            this.isDisplayToast = false
            this.messageTimer = null
          }, 3000)
        },
        // 开始下载
        download(
          list: bilibili.OutMedia[],
          onComplete = (blob: Blob, video: bilibili.OutMedia) => {}
        ) {
          list.forEach((video) => {
            if (video.isDownloading || (video.isDownloaded && video.blob))
              return
            video.isDownloading = true
            fetch(video.url.replace(/^https?/, 'https'), {
              method: 'GET',
              headers: {},
              mode: 'cors',
              cache: 'default',
              referrerPolicy: 'no-referrer-when-downgrade',
            })
              .then(
                fetchProgress({
                  defaultSize: video.bytes || 0,
                  onProgress: (progress) => {
                    if (progress > 1) progress = 1
                    video.progress = progress * 100
                  },
                })
              )
              .then((response: Response) => response.blob())
              .then((blob) => {
                onComplete(blob, video)
                video.isDownloading = false
              })
              .catch((error) => {
                console.error(error)
                this.showToast('下载出错了/(ㄒoㄒ)/~~')
                video.isFail = true
                video.isDownloading = false
              })
          })
        },
        // 点击合并下载
        onMergeDownloadClick() {
          this.download(
            this.videoList,
            (blob: Blob, video: bilibili.OutMedia) => {
              video.blob = blob
              video.isDownloaded = true
            }
          )
        },
        // 点击选择下载
        onDownloadClick() {
          if (!this.selectAudioList.length && !this.selectVideoList.length) {
            this.showToast('请选择需要下载的片段')
            return
          }
          if (this.version === 1) {
            this.download(
              this.selectVideoList,
              (blob: Blob, video: bilibili.OutMedia) => {
                saveAs(blob, video.name)
              }
            )
          } else if (this.version === 2) {
            copyText(this.code)
            logger.success('[video-parser]', '复制指令', this.code)
            this.showToast('下载指令已经复制到剪贴板！')
          }
        },
      },
      watch: {
        downloadedVideoList(list: bilibili.OutMedia[]) {
          if (list.length === 0) return
          if (list.length === this.videoList.length) {
            this.showToast('正在合并中，请稍后……')
            FLV.mergeBlobs(list.map((item) => item.blob)).then(
              (mergeBlob: Blob) => {
                saveAs(mergeBlob, this.safeVideoName + list[0].ext)
                this.showToast('合并完成！请慢用(｡･ω･｡)')
              }
            )
          }
        },
      },
    })
  }

  /**
   * 添加监听
   */
  addListener() {
    this.addMessageListener()
    this.addFullScreenListener()
    this.addCheckViewListener()
  }

  addMessageListener() {
    this.port.onMessage.addListener((msg, port) => {
      logger.success('[video-parser]', '接收数据', msg)
      if (msg.action === 'fetch') {
        this.fetchData(msg)
        return
      }
      this.setData(msg)
    })
    logger.message('[video-parser] state', 'loadedMessageListener')
  }

  addFullScreenListener() {
    const targetNode = document.getElementById('bilibili-player')
    if (!targetNode) return

    const config = { attributes: true }

    const observer = new MutationObserver((mutationsList, observer) => {
      for (let mutation of mutationsList) {
        const { type, attributeName, target } = mutation
        if (type === 'attributes' && attributeName === 'class') {
          const isFullScreen = (target as HTMLElement).classList.contains(
            'full-screen'
          )
          if (this.app) {
            this.app.isFullScreen = isFullScreen
            if (isFullScreen) this.app.isDisplayPopover = false
          }
        }
      }
    })

    observer.observe(targetNode, config)
    this.state.loadedFullScreenListener = true
    logger.message('[video-parser] state', 'loadedFullScreenListener')
  }

  addCheckViewListener() {
    const node = document.querySelector('title')
    if (!node) return
    let retry = 0
    const check = () => {
      if (node.innerHTML.includes('（僅限')) {
        if (!$('#video-parser').length) {
          logger.message('[video-parser] view', '港澳台重定向，界面重新加载！')
          if (this.app) this.app.$destroy()
          this.initVue()
          this.addview()
          retry = 99
        }
      } else {
        logger.message('[video-parser] check:' + retry, '按钮已添加!')
      }
    }
    const timer = setInterval(() => {
      if (retry > 5) {
        clearInterval(timer)
        return
      }
      check()
      retry++
    }, 3000)

    logger.message('[video-parser] state', 'loadedCheckViewListener')
  }

  postMessage(msg: Object) {
    this.port.postMessage(msg)
  }

  $mount(el: string | Element) {
    if (this.app) this.app.$mount(el)
  }

  // 请求数据，通过挂在script脚本执行。（因为contentScript是沙盒模式执行的）
  fetchData(msg: any) {
    let url = msg.data.url
    url += (url.includes('?') ? '&' : '?') + 'requestFrom=bilibili-helper'

    const script = document.createElement('script')
    script.dataset.name = 'video-parser'
    script.innerHTML = `$ && $.ajax({url:'${url}',dataType:"json",xhrFields:{withCredentials:!0},
success:function(json){
    const data = json.result || json.data
    const bridge = document.querySelector('#video-parser-data')
    bridge.innerHTML = JSON.stringify({data,url:'${url}',info:window.__INITIAL_STATE__})
    bridge.dispatchEvent(new Event('fetch_response'))
},
error:function(e){}})`
    document.body.appendChild(script)
  }

  // 添加界面
  addview() {
    $('body').append('<div id="video-parser"></div>')
    const el = $('#video-parser')
    const cssURL = getExtensionURL('css/downloadView.css')
    el.before(`<link  rel="stylesheet" type="text/css" href="${cssURL}"/>`)
    $('head')
      .append(
        `<script id="video-parser-info">document.querySelector('#video-parser-info').innerHTML=JSON.stringify(window.__INITIAL_STATE__)</script>`
      )
      .append(`<script id="video-parser-data"></script>`)
    el.load(
      getExtensionURL('template/downloadView.html'),
      (resonse, status, xhr) => {
        if (status === 'success') {
          logger.success('[video-parser]', '添加下载界面成功！')
          this.$mount('#video-parser')
          this.port.postMessage(buildMsg({ message: 'get_cache' }))
          const parserDataEl = $('#video-parser-data')
          // 监听数据请求的结果
          parserDataEl.on('fetch_response', (e) => {
            try {
              const data = JSON.parse(e.target.innerHTML)
              this.port.postMessage(
                buildMsg({ message: 'fetch_response', data })
              )
              console.log(data)
            } catch (error) {
              logger.error('[video-parser]', error)
            }
          })

          this.parsePlayinfo()
        }
      }
    )
  }

  /**
   * 解析本地视频信息并发送给背景页
   */
  parsePlayinfo() {
    const playinfo_script = $('script:contains("__playinfo__")')
    if (playinfo_script.length) {
      const jsText = playinfo_script.eq(0).text()
      const vInfo = jsText.substr(jsText.indexOf('{'), jsText.lastIndexOf('}'))
      const playinfo = JSON.parse(vInfo)
      playinfo.info = JSON.parse(
        document.querySelector('#video-parser-info').innerHTML || '{}'
      )
      this.postMessage(buildMsg({ message: 'local_playinfo', data: playinfo }))
    }
  }
  /**
   * 获取视频标题
   */
  getTitle() {
    let title = $('.media-wrapper h1').text()
    if (!title || title.includes('銀魂（僅限港澳台地區）：01-02')) {
      title = $('.media-wrapper .media-title').text()
      if ($('#eplist_module').length) {
        const subTitle = $('#eplist_module li.cursor .ep-title').attr('title')
        if (subTitle) title += '：' + subTitle
      }
    }

    logger.success('[video-parser]', `使用备用方案获取本地标题:${title}`)
    return title
  }

  /**
   * 设置数据
   * @param data
   */
  setData(data: any) {
    if (this.app) {
      this.app.setTitle(data.title || this.getTitle())
      this.app.setData(data)
    }
  }
}
