import type { AxiosError, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useSessionStore } from '@/stores/modules/session'

export const http = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

/**
 * 全局请求拦截
 */
http.interceptors.request.use(
  (config) => {
    if (config.url?.startsWith('/chat')) {
      config.headers.set(
        'Authorization',
        `Bearer ${import.meta.env.VITE_CHAT_API_KEY}`,
      )

      const method = config.method?.toLocaleUpperCase()
      const user = useSessionStore().user

      if (method === 'GET') {
        config.params = {
          ...config.params,
          user,
        }
      }
      else {
        config.data = {
          ...config.data,
          user,
        }
      }
    }

    return config
  },
  async (error) => {
    console.error(error)
    return Promise.reject(error)
  },
)

/**
 * 全局响应拦截
 */
http.interceptors.response.use(
  async (response) => {
    return response.data
  },
  async (error: AxiosError) => {
    const data = error.response?.data || {} as any

    let msg = data.message || data.msg || '系统错误'

    if (error.code === 'ECONNABORTED') {
      msg = '请求超时'
    }

    if (error.code === 'ERR_NETWORK') {
      msg = '网络错误'
    }

    ElMessage.error({
      grouping: true,
      message: msg,
    })

    return Promise.reject(error)
  },
)

export type AxiosRC<D = any, P = Recordable> = AxiosRequestConfig<D> & P

export const createRequest = <T = any, D = any, P = Recordable>(
  url: string,
  configOrMethod: AxiosRC['method'] | AxiosRC<D, P> = 'GET',
) => {
  let controller: AbortController

  const request = async (payload?: D, config?: AxiosRC<D, P>) => {
    configOrMethod = (
      typeof configOrMethod === 'string'
        ? { method: configOrMethod }
        : configOrMethod
    ) as AxiosRC<D, P>

    controller = new AbortController()

    const finalConfig = {
      signal: controller.signal,
      ...configOrMethod,
      ...config,
    }

    const method = configOrMethod?.method
    url = transformUrl(url, config)

    if (method === 'GET') {
      finalConfig.params = {
        ...configOrMethod?.params,
        ...payload,
      }

      return http.get<T, D>(url, finalConfig)
    }
    else {
      const data = typeof configOrMethod?.data === 'object'
        ? {
            ...configOrMethod.data,
            ...payload,
          }
        : payload

      return http.request<T, D>({
        ...finalConfig,
        method,
        data,
        url,
      })
    }
  }

  request.abort = (reason: any) => controller?.abort(reason)

  return request
}

export const transformUrl = (url: string, config?: Recordable) => {
  // 匹配以 /: 开头或 URL 中间的 :xxx，但不能是 :数字（即端口号）
  const match = url.match(/\/:([a-z_][\w-]*)/gi)

  match?.forEach((r) => {
    const key = r.slice(2) // 去掉前缀 "/:"
    url = url.replace(r, `/${config?.[key] ?? ''}`)
  })

  return url
}
