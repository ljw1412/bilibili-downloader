import Vue from 'vue'
import { saveAs } from 'file-saver'
import FLV from './Flv'
import { copyText, fetchProgress } from '../utils'

export default new Vue({
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
      return this.videoList.filter((item: bilibili.OutMedia) => item.isActived)
    },
    // 被选中的音频列表
    selectAudioList() {
      return this.audioList.filter((item: bilibili.OutMedia) => item.isActived)
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
    setTitle(title: string) {
      this.title = title
    },
    setData({ action, data }: bilibili.ProcessedMessage) {
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
        data.videoList.forEach(item => {
          item.isActived = false
        })
        data.audioList.forEach(item => {
          item.isActived = false
        })
        this.data = data
      }
    },
    onButtonClick() {
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
        list.forEach(item => {
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
          .then((response: Response) => response.blob())
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
      this.download(this.videoList, (blob: Blob, video: bilibili.OutMedia) => {
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
        this.download(
          this.selectVideoList,
          (blob: Blob, video: bilibili.OutMedia) => {
            saveAs(blob, video.name)
          }
        )
      } else if (this.version === 2) {
        copyText(this.code)
        this.showToast('下载指令已经复制到剪贴板！')
      }
    }
  },
  watch: {
    downloadedVideoList(list: bilibili.OutMedia[]) {
      if (list.length === 0) return
      if (list.length === this.videoList.length) {
        this.showToast('正在合并中，请稍后……')
        FLV.mergeBlobs(list.map(item => item.blob)).then((mergeBlob: Blob) => {
          saveAs(mergeBlob, this.safeVideoName + list[0].ext)
          this.showToast('合并完成！请慢用(｡･ω･｡)')
        })
      }
    }
  }
})
