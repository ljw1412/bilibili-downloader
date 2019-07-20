const matchList = {
  bilibili: /\.bilibili\./
}

let website
function matchWebsite() {
  const keys = Object.keys(matchList)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (matchList[key].test(location.host)) {
      website = key
      return true
    }
  }
  return false
}

;(function() {
  matchWebsite()
  parsePlayinfo()
})()

function sendMessage(action, data) {
  chrome.extension.sendMessage({ action, data, website })
}

// function sendMessage(action, data) {
//   chrome.extension.sendMessage()
// }

function parsePlayinfo() {
  const playinfo_script = $('script:contains("__playinfo__")')
  if (playinfo_script.length) {
    const jsText = playinfo_script.eq(0).text()
    const vInfo = jsText.substr(jsText.indexOf('{'), jsText.lastIndexOf('}'))
    const playinfo = JSON.parse(vInfo)
    sendMessage('playinfo', playinfo)
  }
}
