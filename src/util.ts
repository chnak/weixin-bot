import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

export class FetchTimeout {
  static async get(url: string, timeout = 5000): Promise<AxiosResponse> {
    return axios.get(url, { timeout })
  }

  static async post(url: string, body: unknown, timeout = 5000): Promise<AxiosResponse> {
    return axios.post(url, body, {
      timeout,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  static async request(url: string, options: AxiosRequestConfig, timeout: number): Promise<AxiosResponse> {
    return axios({
      url,
      ...options,
      timeout,
    })
  }
}
