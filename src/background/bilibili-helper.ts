import { formatDuration } from './uitls'
const qualityMap: { [key: number]: string } = {
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

const tabs = {}

export const parse = (message: any) => {
  const palyinfo = message.data.data
  return parsePlayInfo(palyinfo)
}

export const parseResponse = (response: any) => {
  console.log(response)
}

export const parsePlayInfo = (playinfo: any) => {
  let videoList = [],
    audioList = [],
    duration,
    quality,
    qualityStr,
    version
  const dash = playinfo.dash
  const durl = playinfo.durl
  if (dash) {
    version = 2
    videoList = dash.video
    audioList = dash.audio
    quality = playinfo.quality
    qualityStr = qualityMap[quality]
    duration = formatDuration(dash.duration || 0)
  } else if (durl) {
    version = 1
    videoList = durl
    quality = playinfo.quality
    qualityStr = qualityMap[quality]
    duration = formatDuration(playinfo.timelength / 1000 || 0)
  }
  return { version, duration, quality, qualityStr, videoList, audioList }
}
