import { parseBlilibi } from './core/bilibili/index'
import { addPort, removePort } from './helper/port-manager'
import cache from './helper/cache'

const extensionId = chrome.runtime.id

function onMessage(msg: any = {}) {
  parseBlilibi(msg)
}

chrome.extension.onConnect.addListener(function(port) {
  if (port.sender.id !== extensionId) return
  const tabId = port.sender.tab.id
  addPort(tabId, port)
  // 重新执行缓存内的方法，一般情况下解决连接慢于页面加载的一些关键事件
  cache.resume(tabId)
  port.onMessage.addListener(function(msg) {
    msg.tabId = tabId
    onMessage(msg)
  })
  port.onDisconnect.addListener(function(port) {
    removePort(tabId)
  })
})

chrome.tabs.onRemoved.addListener((tabId, moveInfo) => {
  cache.remove(tabId)
})
