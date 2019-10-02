import videoVue from './videoVue'
import { getExtensionURL, sendMessage } from '../utils'

export default class Bilibili {
  app: any

  constructor(type: string = 'video') {
    if (type === 'video') {
      this.app = videoVue
    }
  }

  init() {
    this.addview()
  }

  $mount(el: string | Element) {
    if (this.app) this.app.$mount(el)
  }

  // 添加界面
  addview() {
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
          this.$mount('#video-parser')
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
      sendMessage('playinfo', playinfo)
    } else {
      sendMessage('ready')
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
