import VideoParser from './VideoParser'

export const parse = (message: bilibili.Message) => {
  const playInfo = message.data.data
  return parsePlayInfo(playInfo)
}

/**
 * 解析播放信息
 * @param playInfo 播放信息
 */
export const parsePlayInfo = (playInfo: bilibili.PlayInfo) => {
  if (playInfo.dash) {
    return new VideoParser(playInfo, 2).parse()
  } else if (playInfo.durl) {
    return new VideoParser(playInfo, 1).parse()
  }
  return {}
}

/**
 * 请求并解析
 * @param request
 */
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
