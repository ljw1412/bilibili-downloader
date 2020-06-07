type Port = chrome.runtime.Port

const ports: Record<number, Port> = {}

window.getCurrentPorts = () => {
  console.log(ports)
}

export function getPort(tabId: number) {
  return ports[tabId]
}

export function addPort(tabId: number, port: Port) {
  ports[tabId] = port
}

export function removePort(tabId: number) {
  if (ports[tabId]) delete ports[tabId]
}
