import videoVue from './videoVue'

export default class Bilibili {
  app: any

  constructor(el: string | Element, type: string = 'video') {
    if (type === 'video') {
      this.app = videoVue
    }
    if (this.app) this.app.$mount(el)
  }

  /**
   * 解析本地视频信息并发送给背景页
   */
  parsePlayinfo(sendMessage: Function) {
    const playinfo_script = $('script:contains("__playinfo__")')
    if (playinfo_script.length) {
      const jsText = playinfo_script.eq(0).text()
      const vInfo = jsText.substr(jsText.indexOf('{'), jsText.lastIndexOf('}'))
      const playinfo = JSON.parse(vInfo)
      sendMessage('playinfo', playinfo)
    }
  }
  /**
   * 获取视频标题
   */
  getTitle() {
    let title = $('.media-wrapper h1').text() || $('.video-title .tit').text()
    if ($('#multi_page').length && $('.list-box').length) {
      const subTitle = $('.list-box li.on a').attr('title')
      if (subTitle) title += subTitle
    }
    return title
  }

  /**
   * 设置数据
   * @param data
   */
  setData(data: any) {
    if (this.app) {
      this.app.setTitle(this.getTitle())
      this.app.setData(data)
    }
  }
}
