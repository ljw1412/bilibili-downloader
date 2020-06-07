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

  export namespace onConnect {
    export function addListener(fn: (port: chrome.runtime.Port) => void): void
  }

  export function connect(opitons: { name: string }): chrome.runtime.Port
}
