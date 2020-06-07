import * as logger from '../../utils/logger'
import BilibiliComic from './comic'
import BilibiliVideo from './video'

export default class Bilibili {
  port!: chrome.runtime.Port
  type!: 'comic' | 'video'
  url!: string

  constructor(port: chrome.runtime.Port) {
    this.port = port
    this.url = location.href
    this.init()
  }

  init() {
    this.getPageType()
    this.load()
    logger.success('[video-parser]', '脚本注入成功 ┏ (゜ω゜)=☞')
  }

  /**
   * 获取页面类型
   */
  getPageType() {
    const isComic = this.url.includes('manga.bilibili.com/detail')
    this.type = isComic ? 'comic' : 'video'
  }

  /**
   * 加载
   */
  load() {
    if (this.type === 'comic') {
      new BilibiliComic()
    } else if (this.type === 'video') {
      new BilibiliVideo(this.port)
    }
  }
}
