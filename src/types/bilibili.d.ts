declare namespace bilibili {
  interface FlvVideo {
    url: string
    size: number
    order: number
    length: number
  }

  interface Mp4Model {
    id: number
    mimeType: string
    codecs: string
    baseUrl: string
    bandwidth: number
  }

  interface Mp4Video {
    audio: Mp4Model[]
    video: Mp4Model[]
    duration: number
  }

  interface PlayInfo {
    accept_description: string[]
    accept_format: string
    accept_quality: number[]
    durl?: FlvVideo[]
    dash?: Mp4Video
    message: string
    format: string
    from: string
    quality: number
    timelength: number
  }

  // 页面注入的视频数据或请求接口后视频数据
  interface MessageData {
    code: number
    data: PlayInfo
    message: string
  }

  // 数据处理后的媒体对象
  interface OutMedia {
    order?: number
    name?: string
    ext?: string | null
    url: string
    duration: string
    size: string
    bytes?: number
    quality: number
    qualityStr: string
    // in page
    isDownloading?: boolean
    isDownloaded?: boolean
    isFail?: boolean
    isActived?: boolean
    progress?: string | number
    blob?: Blob
  }

  // 视频数据处理后的统一数据类型
  interface ProcessedData {
    version: number
    duration: string
    quality: number
    qualityStr: string
    videoList: OutMedia[]
    audioList: OutMedia[]
  }

  // content.js 与 background 通信消息类型
  interface Message {
    action: string
    data?: MessageData
  }

  // 处理后的消息
  interface ProcessedMessage {
    action: string
    data?: ProcessedData
  }
}
