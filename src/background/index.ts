import * as bilibiliHelper from './bilibili-helper'

chrome.webRequest.onBeforeRequest.addListener(
  data => {
    console.log('onBeforeRequest', data)
  },
  {
    urls: ['*://*.bilibili.com/*playurl?*'],
    types: ['object', 'other', 'xmlhttprequest']
  },
  ['requestBody']
)

chrome.webRequest.onBeforeSendHeaders.addListener(
  data => {
    console.log('onBeforeSendHeaders', data)
  },
  {
    urls: ['*://*.bilibili.com/*playurl?*'],
    types: ['object', 'other', 'xmlhttprequest']
  },
  ['requestHeaders']
)

chrome.webRequest.onSendHeaders.addListener(
  data => {
    if (data.tabId === -1) return
    console.log('onSendHeaders', data)
    const headers: any = {}
    data.requestHeaders.forEach(({ name, value }) => {
      headers[name] = value
    })
    fetch(data.url, { headers })
      .then(data => data.json())
      .then(json => console.log(json))
  },
  {
    urls: ['*://*.bilibili.com/*playurl?*'],
    types: ['object', 'other', 'xmlhttprequest']
  },
  ['requestHeaders']
)

chrome.webRequest.onResponseStarted.addListener(
  data => {
    bilibiliHelper.parseResponse(data)
  },
  {
    urls: ['*://*.bilibili.com/*playurl?*'],
    types: ['object', 'other', 'xmlhttprequest']
  },
  ['responseHeaders']
)

chrome.webRequest.onCompleted.addListener(
  data => {
    console.log('onCompleted', data)
  },
  {
    urls: ['*://*.bilibili.com/*playurl?*'],
    types: ['object', 'other', 'xmlhttprequest']
  },
  ['responseHeaders']
)
