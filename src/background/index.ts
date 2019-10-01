import * as log from './log'
import * as bilibiliHelper from './bilibili'

const extensionId = chrome.runtime.id

const matchList: { [key: string]: RegExp } = {
  bilibili: /\.bilibili\./
}

function matchWebsite(url: string) {
  const keys = Object.keys(matchList)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (matchList[key].test(url)) {
      return key
    }
  }
  return ''
}

function sendToTab(tabId: number, action: string, message?: any) {
  chrome.tabs.sendMessage(tabId, { action, data: message })
}

// 截取playurl api 并解析
chrome.webRequest.onBeforeSendHeaders.addListener(
  request => {
    const requestHeaders = request.requestHeaders
    if (request.initiator && request.initiator.indexOf(extensionId) > -1) {
      requestHeaders.push({
        name: 'Referer',
        value: 'https://www.bilibili.com'
      })
      requestHeaders.push({
        name: 'Origin',
        value: 'https://www.bilibili.com'
      })
      return { requestHeaders }
    }
    if (request.tabId != -1) {
      const tabId = request.tabId
      const website = matchWebsite(request.url)
      log.message(`[api] website:${website} tabId:${tabId}`, request)
      bilibiliHelper.parseRequest(request).then(result => {
        log.success(`website:${website} tabId:${tabId}`, result)
        sendToTab(tabId, 'list', result)
      })
    }
  },
  {
    urls: ['*://*.bilibili.com/*playurl?*']
  },
  ['blocking', 'requestHeaders']
)

// 从页面获取播放信息并解析
chrome.extension.onMessage.addListener(
  (message: common.Message, sender: any) => {
    const tabId = sender.tab.id
    const website = matchWebsite(sender.url)
    log.message(`website:${website} tabId:${tabId}`, { message, sender })
    let result: any = {}
    if (website === 'bilibili') {
      result = bilibiliHelper.parse(message)
    }
    log.success(`website:${website} tabId:${tabId}`, result)
    sendToTab(tabId, 'list', result)
  }
)
