export function formatDuration(duration: number) {
  const list = [
    Math.floor(duration / 3600) % 24,
    ('0' + (Math.floor(duration / 60) % 60)).substr(-2),
    ('0' + Math.floor(duration % 60)).substr(-2)
  ]
  return list.filter(item => item > 0).join(':')
}
