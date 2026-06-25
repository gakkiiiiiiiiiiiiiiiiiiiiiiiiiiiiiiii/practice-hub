/**
 * 页面导航工具函数
 * 统一处理页面跳转，避免 navigateTo 跳转到 tabBar 页面的错误
 */

// TabBar 页面列表
const TABBAR_PAGES = [
  '/pages/index/index',
  '/pages/bank/index',
  '/pages/category/index',
  '/pages/user/index'
]

/**
 * 智能页面跳转
 * 自动判断是 tabBar 页面还是普通页面，使用正确的跳转方式
 * @param {string} url - 页面路径
 * @param {object} options - 跳转选项
 */
export const navigateTo = (url, options = {}) => {
  // 检查是否是 tabBar 页面
  const isTabBarPage = TABBAR_PAGES.some(page => url.startsWith(page))
  
  if (isTabBarPage) {
    // 使用 switchTab 跳转到 tabBar 页面
    return uni.switchTab({
      url,
      ...options
    })
  } else {
    // 使用 navigateTo 跳转到普通页面
    return uni.navigateTo({
      url,
      ...options
    })
  }
}

/**
 * 重定向到页面（关闭当前页面）
 * @param {string} url - 页面路径
 * @param {object} options - 跳转选项
 */
export const redirectTo = (url, options = {}) => {
  const isTabBarPage = TABBAR_PAGES.some(page => url.startsWith(page))
  
  if (isTabBarPage) {
    // tabBar 页面不能使用 redirectTo，使用 switchTab
    return uni.switchTab({
      url,
      ...options
    })
  } else {
    return uni.redirectTo({
      url,
      ...options
    })
  }
}

/**
 * 跳转到 tabBar 页面
 * @param {string} url - 页面路径
 */
export const switchToTab = (url) => {
  return uni.switchTab({
    url
  })
}

/**
 * 跳转到普通页面
 * @param {string} url - 页面路径
 * @param {object} options - 跳转选项
 */
export const goToPage = (url, options = {}) => {
  return uni.navigateTo({
    url,
    ...options
  })
}

