import * as log from './log'
import * as bilibiliHelper from './bilibili'

const extensionId = chrome.runtime.id

const cache: Record<any, any> = {}
// 可视化缓存
window.printCache = () => {
  console.log(cache)
}

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

function appendHeader(headers: any[], name: string, value: string) {
  headers.push({ name, value })
}

// 截取playurl api 并解析
chrome.webRequest.onBeforeSendHeaders.addListener(
  request => {
    const requestHeaders = request.requestHeaders
    // 如果为插件请求添加 Referer，Origin
    if (request.initiator && request.initiator.indexOf(extensionId) > -1) {
      appendHeader(requestHeaders, 'Referer', 'https://www.bilibili.com')
      appendHeader(requestHeaders, 'Origin', 'https://www.bilibili.com')
      return { requestHeaders }
    }
    if (request.tabId != -1) {
      const tabId = request.tabId
      const website = matchWebsite(request.url)
      log.message(`[api] website:${website} tabId:${tabId}`, request)
      bilibiliHelper.parseRequest(request).then(result => {
        log.success(`website:${website} tabId:${tabId}`, result)
        sendToTab(tabId, 'list', result)
        cache[tabId] = result
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
    if (!message.action) throw new TypeError('message中必须有action字段')
    const tabId = sender.tab.id
    const website = matchWebsite(sender.url)
    log.message(`[${message.action}] website:${website} tabId:${tabId}`, {
      message,
      sender
    })
    switch (message.action) {
      case 'playinfo':
        let result: any = {}
        if (website === 'bilibili') {
          result = bilibiliHelper.parse(message)
        }
        log.success(`website:${website} tabId:${tabId}`, result)
        sendToTab(tabId, 'list', result)
        break
      case 'ready':
        if (cache[tabId]) sendToTab(tabId, 'list', cache[tabId])
        break
      default:
        console.log(`暂时没有处理该类型[${message.action}]的方法`)
        break
    }
  }
)

chrome.tabs.onRemoved.addListener((tabId, moveInfo) => {
  if (cache[tabId]) delete cache[tabId]
})
