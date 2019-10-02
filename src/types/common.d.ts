interface Window {
  printCache?: Function
}

declare namespace common {
  interface Message {
    action: string
    data?: any
  }
}
