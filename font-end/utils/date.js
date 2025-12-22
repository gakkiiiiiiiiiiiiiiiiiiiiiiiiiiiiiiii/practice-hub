/**
 * 日期处理工具
 */

/**
 * 计算距离目标日期的天数
 * @param {string|Date} targetDate 目标日期
 * @returns {number} 剩余天数
 */
export const getDaysUntil = (targetDate) => {
  const target = new Date(targetDate)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
}

/**
 * 格式化日期
 * @param {Date|string|number} date 日期
 * @param {string} format 格式，默认 'YYYY-MM-DD'
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 格式化倒计时
 * @param {number} seconds 总秒数
 * @returns {string} 格式化的时间字符串，如 "02:30:45"
 */
export const formatCountdown = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

