interface Window {
  getCurrentCache?: Function
  getCurrentPorts?: Function
  videoParse?: {
    port?: chrome.runtime.Port
  }
}

declare namespace common {
  interface Message {
    action: string
    data?: any
  }

  interface Message {
    website: string
    type: string
    message: string
    tabId?: number
    data?: any
  }
}
