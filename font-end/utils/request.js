/**
 * 请求封装
 * 统一处理请求拦截、响应拦截、错误处理
 */

// 后端服务地址
// 注意：微信开发者工具中，使用 127.0.0.1 比 localhost 更稳定
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://127.0.0.1:3333/api' 
  : 'https://api.example.com/api'

// 请求拦截器
const requestInterceptor = (config) => {
  // 后端接口需要 token，如果有 token 就发送（但不进行权限校验）
  const token = uni.getStorageSync('auth_token')
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  // 设置默认 header
  config.header = {
    'Content-Type': 'application/json',
    ...config.header
  }
  
  return config
}

// 响应拦截器
const responseInterceptor = (response) => {
  const { statusCode, data } = response
  
  // 处理响应数据为空的情况
  if (!data) {
    console.warn('响应数据为空:', response)
    return Promise.reject(new Error('服务器返回数据为空'))
  }
  
  // HTTP 状态码处理
  if (statusCode === 200) {
    // 业务状态码处理
    // 兼容不同的响应格式
    const code = data.code || data.statusCode || 200
    const message = data.message || data.msg || '请求失败'
    
    if (code === 200 || code === 0 || !data.hasOwnProperty('code')) {
      // 成功：返回 data 字段或整个 data
      return Promise.resolve(data.data !== undefined ? data.data : data)
    } else if (code === 401) {
      // 暂时不进行权限校验，直接返回后端错误信息，不显示"登录已过期"
      // const token = uni.getStorageSync('auth_token')
      // if (token) {
      //   uni.removeStorageSync('auth_token')
      //   uni.removeStorageSync('user_info')
      //   setTimeout(() => {
      //     uni.reLaunch({
      //       url: '/pages/login/index',
      //       fail: (err) => {
      //         console.error('跳转登录页失败:', err)
      //       }
      //     })
      //   }, 100)
      // }
      // 返回后端实际错误信息，如果没有则返回通用错误
      return Promise.reject(new Error(message || '请求失败，请稍后重试'))
    } else {
      // 其他业务错误
      return Promise.reject(new Error(message || '请求失败'))
    }
  } else if (statusCode === 401) {
    // 暂时不进行权限校验，直接返回后端错误信息，不显示"登录已过期"
    // const token = uni.getStorageSync('auth_token')
    // if (token) {
    //   uni.removeStorageSync('auth_token')
    //   uni.removeStorageSync('user_info')
    //   setTimeout(() => {
    //     uni.reLaunch({
    //       url: '/pages/login/index',
    //       fail: (err) => {
    //         console.error('跳转登录页失败:', err)
    //       }
    //     })
    //   }, 100)
    // }
    // 返回后端实际错误信息，如果没有则返回通用错误
    const errorMsg = data?.message || data?.msg || '请求失败，请稍后重试'
    return Promise.reject(new Error(errorMsg))
  } else if (statusCode === 404) {
    // 资源不存在
    const errorMsg = data?.message || data?.msg || '请求的资源不存在'
    return Promise.reject(new Error(errorMsg))
  } else {
    // 其他 HTTP 错误
    const errorMsg = data?.message || data?.msg || `请求失败 (${statusCode})`
    return Promise.reject(new Error(errorMsg))
  }
}

/**
 * 通用请求方法
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 请求拦截
    const config = requestInterceptor({
      url: options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: options.header || {},
      timeout: options.timeout || 10000
    })
    
    // 发送请求
    uni.request({
      ...config,
      success: (res) => {
        try {
          responseInterceptor(res)
            .then(resolve)
            .catch(reject)
        } catch (error) {
          console.error('响应处理错误:', error)
          reject(error)
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err)
        // 不显示 toast，避免频繁弹窗
        // 只在关键操作时显示错误提示
        reject(err)
      }
    })
  })
}

/**
 * GET 请求
 */
export const get = (url, params = {}) => {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
  
  const fullUrl = queryString ? `${url}?${queryString}` : url
  
  return request({
    url: fullUrl,
    method: 'GET'
  })
}

/**
 * POST 请求
 */
export const post = (url, data = {}) => {
  return request({
    url,
    method: 'POST',
    data
  })
}

/**
 * PUT 请求
 */
export const put = (url, data = {}) => {
  return request({
    url,
    method: 'PUT',
    data
  })
}

/**
 * DELETE 请求
 */
export const del = (url, data = {}) => {
  return request({
    url,
    method: 'DELETE',
    data
  })
}

export default {
  get,
  post,
  put,
  delete: del
}

