import { formatDuration, formatFileSize, getFileName, getExt } from './uitls'
const videoQualityMap: { [key: number]: string } = {
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
const audioQualityMap: { [key: number]: string } = {
  30280: '高',
  30216: '中'
}

const tabs = {}

export const parse = (message: Message) => {
  const palyinfo = message.data.data
  return parsePlayInfo(palyinfo)
}
/**
 * 处理版本一的数据
 * @param data
 */
const processVersion1 = (playinfo: any) => {}

/**
 * 解析播放信息
 * @param playinfo 播放信息
 */
export const parsePlayInfo = (playinfo: PlayInfo) => {
  let videoList: OutMedia[] = [],
    audioList: OutMedia[] = [],
    duration: string,
    quality: number,
    qualityStr: string,
    version: number
  const dash = playinfo.dash
  const durl = playinfo.durl
  if (dash) {
    version = 2
    quality = playinfo.quality
    qualityStr = videoQualityMap[quality]
    duration = formatDuration(dash.duration || 0)
    videoList = dash.video.map((item: any) => ({
      url: item.baseUrl,
      name: getFileName(item.baseUrl),
      ext: getExt(getFileName(item.baseUrl)),
      duration,
      // 错误的
      size: formatFileSize(item.bandwidth * 128),
      quality: item.id,
      qualityStr: videoQualityMap[item.id]
    }))
    audioList = dash.audio.map((item: any) => ({
      url: item.baseUrl,
      name: getFileName(item.baseUrl),
      ext: getExt(getFileName(item.baseUrl)),
      duration,
      // 错误的
      size: formatFileSize(item.bandwidth * 128),
      quality: item.id,
      qualityStr: audioQualityMap[item.id]
    }))
  } else if (durl) {
    version = 1
    quality = playinfo.quality
    qualityStr = videoQualityMap[quality]
    duration = formatDuration(playinfo.timelength / 1000 || 0)
    videoList = durl.map((item: any) => ({
      order: item.order,
      url: item.url,
      name: getFileName(item.url),
      ext: getExt(getFileName(item.url)),
      duration: formatDuration(item.length / 1000),
      size: formatFileSize(item.size),
      bytes: item.size,
      quality,
      qualityStr
    }))
  }
  return { version, duration, quality, qualityStr, videoList, audioList }
}

export const parseRequest = (request: any) => {
  const headers: Record<string, string> = {}
  request.requestHeaders.forEach((item: Record<string, string>) => {
    headers[item.name] = item.value
  })

  return fetch(request.url, {
    headers,
    credentials: 'same-origin'
  })
    .then(resp => resp.json())
    .then(data => parsePlayInfo(data.result || data.data))
}
