import { getExtensionURL, prependZore } from '../utils'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

interface FetchIndexOptions {
  name: string
  cid: number
  eid: number
  isAll?: boolean
  el?: HTMLElement
}

interface DownloadOptions {
  urlList: string[]
  epName: string
  jszip?: JSZip
  el?: HTMLElement
}

interface BatchDownloadItem {
  name: string
  urls: string[]
  el: HTMLElement
}

export default class BilibiliComic {
  baseUrl = 'https://manga.bilibili.com/twirp/comic.v1.Comic'
  comicId: number
  comicName: string
  list: BatchDownloadItem[] = []
  comic: Record<string, any>
  isDownload = false

  constructor() {}

  // 增加章节遮罩
  addButtonMask() {
    const _this = this
    $('.episode-list .list-data .list-item').prepend(
      '<div class="download-mask"></div>'
    )
    $('.list-item .download-mask').click(function(e) {
      e.stopPropagation()
      const parent = $(this)
        .parent()
        .get(0)
      if ($(this).data('blob')) {
        saveAs($(this).data('blob'), $(this).data('blob-name'))
        return
      }
      const data = $(parent).data()
      if (data && (!data.is_locked || data.is_in_free)) {
        const epName = $(this)
          .siblings('.short-title')
          .text()
        console.log(epName, data)
        _this
          .fetchIndex({
            name: epName,
            cid: data.manga_id,
            eid: data.manga_num,
            el: this
          })
          .then(({ url, name }: { url: string; name: string }) => {
            $(this)
              .data('blob', url)
              .data('blob-name', name)
          })
      }
    })
  }

  // 增加模式切换按钮
  addSwitchButton() {
    const switchModeButton = $('<button id="switch-mode">模式：正常</button>')
    $('.manga-info .action-buttons').append(switchModeButton)
    switchModeButton.click(() => {
      this.isDownload = !this.isDownload
      switchModeButton.text(this.isDownload ? '模式：下载' : '模式：正常')
      if (this.isDownload) {
        $('.episode-list .list-data .list-item').addClass('list-item--stop')
      } else {
        $('.episode-list .list-data .list-item').removeClass('list-item--stop')
      }
    })

    const cssURL = getExtensionURL('css/bilibiliComic.css')
    $('head').append(
      `<link  rel="stylesheet" type="text/css" href="${cssURL}"/>`
    )

    console.log('漫画下载按钮添加完毕')
  }

  appendChapterInfo() {
    if (this.comic) {
      this.comic.ep_list.forEach((item: any) => {
        let el = $(`.short-title:contains(${item.short_title})`)
        if (el.length > 1) {
          el = $(Array.from(el).find(el => el.innerHTML == item.short_title))
        }
        el = el.parent()
        if (el) {
          el.data({ ...item, manga_id: this.comicId, manga_num: item.id })
          if (item.is_locked && !item.is_in_free) {
            el.addClass('list-item--locked')
          }
        } else {
          console.warn('[绑定元素错误] 未找到对应元素！', item)
        }
      })
    }
  }

  // 请求漫画详情
  fetchComicDetail() {
    if (this.comicId) {
      fetch(
        'https://manga.bilibili.com/twirp/comic.v2.Comic/ComicDetail?device=pc&platform=web',
        {
          method: 'post',
          body: JSON.stringify({ comic_id: this.comicId }),
          headers: {
            'content-type': 'application/json'
          },
          credentials: 'same-origin'
        }
      )
        .then(resp => resp.json())
        .then(({ data }) => {
          console.log('[获取漫画信息成功]', data)
          this.comic = data
          this.appendChapterInfo()
        })
        .catch(error => {
          console.error('[获取漫画信息失败]', error)
        })
    }
  }

  init() {
    this.comicId = parseInt(location.pathname.match(/\d+/)[0])
    setTimeout(() => {
      this.addSwitchButton()
      this.addButtonMask()
      this.fetchComicDetail()
      this.comicName = $('.manga-info .manga-title').text()
    }, 500)
  }

  setData() {}

  fetchIndex({ name, cid, eid, isAll, el }: FetchIndexOptions) {
    return fetch(`${this.baseUrl}/GetImageIndex?device=pc&platform=web`, {
      method: 'Post',
      body: JSON.stringify({ ep_id: eid }),
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'same-origin'
    })
      .then(response => response.json())
      .then(({ data }) => data.host + data.path)
      .then(fetch)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer =>
        String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))
      )
      .then(data => {
        const indexDataParser = new IndexDataParser(cid, eid, data)
        return indexDataParser.parse()
      })
      .then(data => JSON.parse(data))
      .then(json => {
        console.log('获取相关漫画地址', json)
        return this.fetchImageList(json.pics)
      })
      .then(({ data }) =>
        data.map(
          (item: { url: string; token: string }) =>
            item.url + '?token=' + item.token
        )
      )
      .then(data => {
        if (isAll) {
          this.list.push({ name, urls: data, el })
        } else {
          return this.download({ urlList: data, epName: name, el })
        }
      })
      .catch(error => {
        console.error(error)
      })
  }

  fetchImageList(urlList: string[]) {
    return fetch(`${this.baseUrl}/ImageToken?device=pc&platform=web`, {
      method: 'Post',
      body: JSON.stringify({ urls: JSON.stringify(urlList) }),
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'same-origin'
    }).then(response => response.json())
  }

  download({ urlList, epName, jszip, el }: DownloadOptions) {
    const zip = jszip || new JSZip()
    const folder = zip.folder(epName)
    const len = urlList.length
    let count = 0
    return Promise.all(
      urlList.map((item, index) =>
        fetch(item)
          .then(response => response.blob())
          .then(blob => {
            console.log(`[${index + 1}/${len}] ${epName}/${index + 1}.jpg`)
            folder.file(`${prependZore(index + 1)}.jpg`, blob)
            count++
            if (el) {
              $(el).css({
                background: `linear-gradient(90deg, #32aaff ${(count / len) *
                  100}%, #fff 0%,#fff 100%)`
              })
              if (count >= len) {
                $(el).css({ background: '#7bce2b' })
              }
            }
            return blob
          })
      )
    ).then(() => {
      if (!jszip) {
        return zip.generateAsync({ type: 'blob' }).then(content => {
          const url = URL.createObjectURL(content)
          const name = `${this.comicName}-${epName}.zip`
          saveAs(url, name)
          return { url, name }
        })
      }
      return
    })
  }

  downloadAll(multi?: boolean) {
    if (multi) {
      this.list.map(item =>
        this.download({ urlList: item.urls, epName: item.name, el: item.el })
      )
    } else {
      const zip = new JSZip()
      return Promise.all(
        this.list.map(item =>
          this.download({
            urlList: item.urls,
            epName: item.name,
            jszip: zip,
            el: item.el
          })
        )
      )
        .then(() => zip.generateAsync({ type: 'blob' }))
        .then(content => {
          this.list = []
          saveAs(content, `${this.comicName}.zip`)
        })
    }
  }
}

class IndexDataParser {
  // 漫画id
  seasonId: number
  // 集数id
  episodeId: number
  // 索引头字节
  head = [66, 73, 76, 73, 67, 79, 77, 73, 67]
  headLength = this.head.length
  // 加密的索引文件
  dataIndex: string
  // 密钥
  key: Uint8Array

  constructor(seasonId: number, episodeId: number, dataIndex: string) {
    if (!this.isNumber(seasonId) || !this.isNumber(episodeId)) {
      throw new TypeError(
        '[Indexer] Both seasonId and episodeId should be number.'
      )
    } else {
      this.seasonId = seasonId
      this.episodeId = episodeId
      this.dataIndex = dataIndex
      this.key = this.getKey()
    }
  }

  isNumber(value: any) {
    return 'number' == typeof value
  }

  dataIndexToU8Array(dataIndex: string) {
    let str
    try {
      str = atob(dataIndex.split(',')[1] || dataIndex)
    } catch (error) {
      str = dataIndex
    }

    const arrayBuffer = new ArrayBuffer(str.length)
    const uint8Array = new Uint8Array(arrayBuffer)

    for (let i = 0; i < str.length; i++) {
      uint8Array[i] = str.charCodeAt(i)
    }

    return uint8Array
  }

  checkValid(uint8Array: Uint8Array) {
    for (let i = 0; i < this.headLength; i++) {
      if (uint8Array[i] !== this.head[i]) {
        return false
      }
    }
    return true
  }

  getKey() {
    const n = new Uint8Array(new ArrayBuffer(8))
    n[0] = this.episodeId
    n[1] = this.episodeId >> 8
    n[2] = this.episodeId >> 16
    n[3] = this.episodeId >> 24
    n[4] = this.seasonId
    n[5] = this.seasonId >> 8
    n[6] = this.seasonId >> 16
    n[7] = this.seasonId >> 24
    return n
  }

  offset(uint8Array: Uint8Array, key = this.key) {
    for (let n = 0; n < uint8Array.length; n++)
      uint8Array[n] = uint8Array[n] ^ key[n % 8]
  }

  parse() {
    let uint8Array = this.dataIndexToU8Array(this.dataIndex)
    if (!uint8Array.length || !this.checkValid(uint8Array)) {
      throw new TypeError('[Indexer] Invalid index data.')
    }
    uint8Array = uint8Array.slice(this.headLength)
    this.offset(uint8Array)
    var zip = new JSZip()
    return zip.loadAsync(uint8Array).then(zip => {
      const dat = zip.files['index.dat']
      if (!dat) {
        throw new Error('[Indexer] Can not find file "' + uint8Array + '".')
      }
      return dat.async('text')
    })
  }
}
