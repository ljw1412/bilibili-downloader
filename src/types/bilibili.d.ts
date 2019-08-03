interface FlvVideo {
  url: string
  size: number
  order: number
  length: number
}

interface Mp4Video {
  audio: {
    id: number
    mimeType: string
    codecs: string
    baseUrl: string
    bandwidth: number
  }[]
  video: {
    id: number
    mimeType: string
    codecs: string
    baseUrl: string
    bandwidth: number
  }[]
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

interface BilibiliMessageData {
  code: number
  data: PlayInfo
  message: string
}

interface Message {
  action: string
  website: string
  data?: BilibiliMessageData
}

interface OutMedia {
  order?: number
  name?: string
  ext?: string | null
  url: string
  duration: string
  size: string
  quality: number
  qualityStr: string
}
