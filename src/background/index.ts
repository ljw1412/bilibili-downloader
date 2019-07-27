import * as log from './log'
import * as bilibiliHelper from './bilibili-helper'

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

chrome.extension.onMessage.addListener((message: Message, sender: any) => {
  const tabId = sender.tab.id
  const website = matchWebsite(sender.url)
  log.message(`website:${website} tabId:${tabId}`, { message, sender })
  let result: any = {}
  if (website === 'bilibili') {
    result = bilibiliHelper.parse(message)
  }
  log.success(`website:${website} tabId:${tabId}`, result)
  sendToTab(tabId, 'list', result)
})

// chrome.webRequest.onBeforeRequest.addListener(
//   data => {
//     console.log('onBeforeRequest', data)
//   },
//   {
//     urls: ['*://*.bilibili.com/*playurl?*'],
//     types: ['object', 'other', 'xmlhttprequest']
//   },
//   ['requestBody']
// )

// chrome.webRequest.onBeforeSendHeaders.addListener(
//   data => {
//     console.log('onBeforeSendHeaders', data)
//   },
//   {
//     urls: ['*://*.bilibili.com/*playurl?*'],
//     types: ['object', 'other', 'xmlhttprequest']
//   },
//   ['requestHeaders']
// )

// chrome.webRequest.onSendHeaders.addListener(
//   data => {
//     if (data.tabId === -1) return
//     console.log('onSendHeaders', data)
//     const headers: any = {}
//     data.requestHeaders.forEach(({ name, value }) => {
//       headers[name] = value
//     })
//     fetch(data.url, { headers })
//       .then(data => data.json())
//       .then(json => console.log(json))
//   },
//   {
//     urls: ['*://*.bilibili.com/*playurl?*'],
//     types: ['object', 'other', 'xmlhttprequest']
//   },
//   ['requestHeaders']
// )

// chrome.webRequest.onResponseStarted.addListener(
//   data => {
//     bilibiliHelper.parseResponse(data)
//   },
//   {
//     urls: ['*://*.bilibili.com/*playurl?*'],
//     types: ['object', 'other', 'xmlhttprequest']
//   },
//   ['responseHeaders']
// )

// chrome.webRequest.onCompleted.addListener(
//   data => {
//     console.log('onCompleted', data)
//   },
//   {
//     urls: ['*://*.bilibili.com/*playurl?*'],
//     types: ['object', 'other', 'xmlhttprequest']
//   },
//   ['responseHeaders']
// )
