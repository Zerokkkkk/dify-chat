/* eslint-disable ts/method-signature-style */
export {}

declare global {
  type ExtractProps<T> = Partial<Parameters<Exclude<(T)['setup'], undefined>>[0]>
  type Recordable<T = Recordable> = Record<string, any> & T
}

declare module 'axios' {
  interface AxiosInstance {
    request<T = any, D = any>(config: AxiosRequestConfig<D>): Promise<T>
    get<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<T>
    delete<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<T>
    post<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>
    put<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>
    patch<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>
  }

  export interface AxiosRequestConfig<D = any> {
    params?: D
  }
}
