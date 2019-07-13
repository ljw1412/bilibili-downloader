import * as bilibiliHelper from './bilibili-helper'

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
