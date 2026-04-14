import axios, { AxiosError } from 'axios'
import { getApiBaseUrl } from '../config/apiConfig'
import type { RequestErrorInfo } from '../types/hot'

const http = axios.create({
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl()
  if (config.headers) {
    config.headers.Accept = 'application/json'
  }
  return config
})

export function normalizeRequestError(error: unknown): RequestErrorInfo {
  const axiosError = error as AxiosError<{ message?: string; msg?: string }>
  const status = axiosError.response?.status
  const payloadMessage = axiosError.response?.data?.message || axiosError.response?.data?.msg
  const fallbackMessage = axiosError.message || '请求失败，请稍后重试'
  const isTimeout = axiosError.code === 'ECONNABORTED'
  const isNetworkError = fallbackMessage.toLowerCase().includes('network error')
  const isCorsLikely = isNetworkError && !status

  let message = payloadMessage || fallbackMessage
  if (isTimeout) {
    message = '请求超时（10s），请检查接口服务状态'
  }

  if (status === 404) {
    message = '当前平台在该接口中不存在（404），请切换其他平台或更换接口地址。'
  }

  if (!status && isCorsLikely) {
    message = '请求失败，可能存在跨域限制或接口地址不可达'
  }

  return {
    message,
    isTimeout,
    isCorsLikely,
    status,
  }
}

export default http
