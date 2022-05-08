import * as logger from '../../../utils/logger'
import { getPort } from '../../helper/port-manager'
import { parsePlayInfo } from './video'
import cache from '../../helper/cache'
import * as dataCache from '../../helper/TabDataCache'

function fecthInTab(tabId: number, url: string) {
  const port = getPort(tabId)
  if (port) {
    port.postMessage({ action: 'fetch', data: { url } })
    logger.request(`website:bilibili tabId:${tabId}`, url)
  } else {
    cache.add(tabId, function() {
      fecthInTab(tabId, url)
    })
  }
}

chrome.webRequest.onCompleted.addListener(
  (detail) => {
    const { tabId, url } = detail
    if (!url.includes('requestFrom=bilibili-helper')) {
      fecthInTab(tabId, url)
    }
  },
  {
    urls: ['*://*.bilibili.com/*playurl?*', '*://*/pgc/player/web/playurl?*'],
  },
  ['responseHeaders']
)

function getTitle(info: any) {
  if (info) {
    if (info.h1Title) return info.h1Title
    if (info.p || info.p === '') {
      const { videos, title, pages } = info.videoData
      if (videos === 1) return title
      const p = info.p || 1
      const page = pages.find((page: any) => page.page == p)
      if (page) return `${title}P${p}：${page.part}`
    }
  }
  return null
}

function postList(port: chrome.runtime.Port, data: any, tabId: number) {
  const result = parsePlayInfo(data) as Record<string, any>
  const massage = { action: 'list', data: result, title: getTitle(data.info) }
  dataCache.addCache(tabId, { ...massage, action: 'cache_list' })
  port.postMessage(massage)
  logger.success(`[toTab] website:bilibili tabId:${tabId}`, massage)
}

export function parseBlilibi(msg: common.Message) {
  const { website, type, message, data, tabId } = msg
  const port = getPort(tabId)
  if (!port || website !== 'bilibili') return
  if (message === 'local_playinfo') {
    postList(port, data, tabId)
  } else if (message === 'fetch_response') {
    logger.response(`website:bilibili tabId:${tabId}`, msg)
    if (data.url.includes('playurl')) {
      postList(port, data, tabId)
    }
  } else if (message === 'get_cache') {
    const cache = dataCache.getCache(tabId)
    if (cache) {
      port.postMessage(cache)
    }
  }
}
