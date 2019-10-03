// 插件ID
export const extensionId = chrome.runtime.id
// 获取插件id下的资源地址
export const getExtensionURL = chrome.extension.getURL
// 向背景页发送消息
export function sendMessage(
  action: string,
  data?: any,
  callback?: (response: any) => void
) {
  chrome.extension.sendMessage({ action, data }, callback)
}

export function copyText(str: string) {
  var text = $(
    '<textarea style="width: 0;height: 0;" id="copy_tmp">' + str + '</textarea>'
  )
  $('body').append(text)
  text.select()
  document.execCommand('Copy')
  $('#copy_tmp').remove()
}

export function prependZore(
  number: number | string,
  maxlength: number = 3
): string {
  if (number >= Math.pow(10, maxlength)) return number + ''
  const zoreList = new Array(maxlength).fill(0)
  const preZore = zoreList.join('')
  return (preZore + number).slice(-maxlength)
}

// fetch 实时进度功能
function isFetchProgressSupported() {
  return (
    typeof Response !== 'undefined' && typeof ReadableStream !== 'undefined'
  )
}
export function fetchProgress({
  defaultSize = 0,
  onProgress = (progress: number) => {}
}) {
  return function(response: Response) {
    if (!isFetchProgressSupported()) {
      return response
    }
    const { body, headers } = response

    const reader = body.getReader()
    const contentLength = parseInt(headers.get('content-length')) || defaultSize
    let bytesReceived = 0
    let progress = 0

    return new Promise((resolve, reject) => {
      const stream = new ReadableStream({
        start(controller) {
          function push() {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  controller.close()
                  onProgress(1)
                  resolve(new Response(stream, { headers }))
                }
                if (value) {
                  bytesReceived += value.length

                  if (contentLength) {
                    progress = bytesReceived / contentLength
                  }
                  onProgress(progress)
                }
                controller.enqueue(value)
                push()
              })
              .catch((err: Error) => {
                reject(err)
              })
          }
          push()
        }
      })
    })
  }
}
