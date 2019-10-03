interface Window {
  printCache?: Function
  test?: any
}

declare namespace common {
  interface Message {
    action: string
    data?: any
  }
}
