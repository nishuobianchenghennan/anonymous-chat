import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

// 配置 API 基础 URL（Pages Functions 使用相对路径，API 在同一域名下）
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const service: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加系统密令到请求头
    const systemPassword = localStorage.getItem('systemPassword')
    if (systemPassword) {
      config.headers['X-System-Password'] = systemPassword
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data
    if (code === 200) {
      return data
    }
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(message))
  }
)

export default service
