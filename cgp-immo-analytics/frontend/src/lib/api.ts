/**
 * Client API pour CGP Immo Analytics.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur inconnue' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // --- Fonds ---
  getFunds(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/api/funds/${qs}`)
  }

  getFund(id: string) {
    return this.request(`/api/funds/${id}`)
  }

  getFundHistory(id: string) {
    return this.request(`/api/funds/${id}/history`)
  }

  getFundFinancials(id: string) {
    return this.request(`/api/funds/${id}/financials`)
  }

  getFundRisk(id: string) {
    return this.request(`/api/funds/${id}/risk`)
  }

  getFundsOverview() {
    return this.request('/api/funds/stats/overview')
  }

  // --- Assets ---
  getAssetsMap(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/api/assets/map${qs}`)
  }

  getFundAssets(fundId: string) {
    return this.request(`/api/assets/fund/${fundId}`)
  }

  // --- Market ---
  getMarketData(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/api/market/${qs}`)
  }

  // --- Auth ---
  register(data: { email: string; password: string; first_name?: string; last_name?: string; school?: string; referral_code?: string }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  login(email: string, password: string) {
    return this.request(`/api/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
      method: 'POST',
    })
  }
}

export const api = new ApiClient(API_URL)
export default api
