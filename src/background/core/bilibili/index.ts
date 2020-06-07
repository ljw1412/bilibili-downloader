import * as logger from '../../../utils/logger'
import { getPort } from '../../helper/port-manager'
import { parsePlayInfo } from './video'
import cache from '../../helper/cache'

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
  detail => {
    const { tabId, url } = detail
    if (!detail.url.includes('requestFrom=bilibili-helper')) {
      fecthInTab(tabId, url)
    }
  },
  {
    urls: ['*://*.bilibili.com/*playurl?*']
  },
  ['responseHeaders']
)

function postList(port: chrome.runtime.Port, data: any, tabId: number) {
  const result = parsePlayInfo(data)
  port.postMessage({ action: 'list', data: result })
  logger.success(`[toTab] website:bilibili tabId:${tabId}`, result)
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
  }
}
