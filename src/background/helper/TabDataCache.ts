const cache: Record<number, any> = {}

window.getCurrentDataCache = () => {
  console.log(cache)
}

export function getCache(tabId: number) {
  return cache[tabId]
}

export function addCache(tabId: number, data: Record<string, any>) {
  cache[tabId] = data
}

export function removeCache(tabId: number) {
  if (cache[tabId]) delete cache[tabId]
}
