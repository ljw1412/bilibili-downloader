import {
  formatDuration,
  formatFileSize,
  getFileName,
  getExt
} from '../../../utils/assist'

const videoQualityMap: Record<number, string> = {
  120: '4K',
  116: '1080P60',
  112: '1080P+',
  80: '1080P',
  74: '720P60',
  64: '720P',
  32: '480P',
  16: '360P',
  15: '360P',
  0: '自动'
}
const audioQualityMap: Record<number, string> = {
  30280: '高质量',
  30232: '中质量',
  30216: '低质量'
}

class VideoParser implements bilibili.ProcessedData {
  playInfo: bilibili.PlayInfo
  version = 0
  duration: string
  quality: number
  qualityStr: string
  videoList: bilibili.OutMedia[] = []
  audioList: bilibili.OutMedia[] = []

  constructor(playInfo: bilibili.PlayInfo, version: number) {
    this.version = version
    this.playInfo = playInfo
    this.init()
  }

  init() {
    if (this.version === 1) {
      this.parseVersion1()
    } else if (this.version === 2) {
      this.parseVersion2()
    } else {
      throw new TypeError('版本类型"version"只能为1或者2')
    }
  }
  /**
   * 处理版本1的数据
   */
  parseVersion1() {
    const durl = this.playInfo.durl
    this.quality = this.playInfo.quality
    this.qualityStr = videoQualityMap[this.quality]
    this.duration = formatDuration(this.playInfo.timelength / 1000 || 0)
    this.videoList = durl.map((item: any) => ({
      order: item.order,
      url: item.url,
      name: getFileName(item.url),
      ext: getExt(getFileName(item.url)),
      duration: formatDuration(item.length / 1000),
      size: formatFileSize(item.size),
      bytes: item.size,
      quality: this.quality,
      qualityStr: this.qualityStr
    }))
  }

  /**
   * 处理版本2的数据
   */
  parseVersion2() {
    const dash = this.playInfo.dash
    this.quality = this.playInfo.quality
    this.qualityStr = videoQualityMap[this.quality]
    this.duration = formatDuration(dash.duration || 0)

    const parseMedia = (
      list: bilibili.Mp4Model[],
      qualityMap: Record<number, string>
    ) => {
      try {
        list.sort((a, b) => b.id - a.id)
      } catch (error) {}
      return list.map((item: bilibili.Mp4Model) => ({
        url: item.baseUrl,
        name: getFileName(item.baseUrl),
        ext: getExt(getFileName(item.baseUrl)),
        duration: this.duration,
        // 错误的
        size: formatFileSize(item.bandwidth * 128),
        quality: item.id,
        qualityStr: qualityMap[item.id]
      }))
    }
    this.videoList = parseMedia(dash.video, videoQualityMap)
    this.audioList = parseMedia(dash.audio, audioQualityMap)
  }

  parse() {
    return {
      version: this.version,
      duration: this.duration,
      quality: this.quality,
      qualityStr: this.qualityStr,
      videoList: this.videoList,
      audioList: this.audioList
    }
  }
}

/**
 * 解析播放信息
 * @param playInfo 播放信息
 */
export const parsePlayInfo = (message: bilibili.MessageData) => {
  const playInfo: bilibili.PlayInfo = message.data
  if (playInfo.dash) {
    return new VideoParser(playInfo, 2).parse()
  } else if (playInfo.durl) {
    return new VideoParser(playInfo, 1).parse()
  }
  return {}
}
