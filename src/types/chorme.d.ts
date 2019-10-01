declare namespace chrome.extension {
  export function sendMessage(
    message: any,
    callback?: (response: any) => void
  ): void

  export namespace onMessage {
    export function addListener(
      message?: any,
      sender?: any,
      sendResponse?: (response?: any) => void
    ): void
  }
}
