/**
 * 解决请求拦截快于页面与插件连接
 */

const cache: Record<number, Function[]> = {}

window.getCurrentCache = () => {
  console.log(cache)
}

export default {
  add(tabId: number, fn: Function) {
    if (!cache[tabId]) cache[tabId] = []
    cache[tabId].push(fn)
  },
  remove(tabId: number) {
    if (cache[tabId]) delete cache[tabId]
  },
  resume(tabId: number) {
    if (cache[tabId] && cache[tabId].length) {
      let fn
      while ((fn = cache[tabId].pop())) {
        fn()
      }
      delete cache[tabId]
    }
  }
}
