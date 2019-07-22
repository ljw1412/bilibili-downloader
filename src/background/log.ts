const baseStyles = 'font-size:12px;padding:1px 10px;font-weight:700;'

const baseLog = (
  type: string,
  bgcolor?: string,
  color?: string,
  bgcolor2?: string,
  color2?: string
) => (info: string, ...data: any) => {
  const leftStyles = `${baseStyles};background-color:${bgcolor};border-radius:5px 0 0 5px;color:${color}`
  const rightStyles = `${baseStyles};background-color:${bgcolor2};border-radius:0 5px 5px 0;color:${color2}`

  console.log(`%c${type}%c${info}\n`, leftStyles, rightStyles, ...data)
}

const logMessage = baseLog('message', '#409EFF', '#fff', '#666', '#fff')

const logSuccess = baseLog('success', '#67C23A', '#fff', '#666', '#fff')

export { logMessage, logSuccess }
