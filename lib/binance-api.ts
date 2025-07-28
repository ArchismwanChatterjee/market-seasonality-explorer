// Binance API utilities and helpers

export const BINANCE_ENDPOINTS = {
  KLINES: "/api/v3/klines",
  TICKER_24HR: "/api/v3/ticker/24hr",
  EXCHANGE_INFO: "/api/v3/exchangeInfo",
  TICKER_PRICE: "/api/v3/ticker/price",
} as const

export const BINANCE_BASE_URL = "https://api.binance.com"

class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly timeWindow: number

  constructor(maxRequests = 1200, timeWindow = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()

    this.requests = this.requests.filter((time) => now - time < this.timeWindow)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest) + 100 // Add 100ms buffer

      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    this.requests.push(now)
  }
}

const rateLimiter = new RateLimiter()

export async function fetchBinanceAPI(endpoint: string, params: Record<string, string | number> = {}): Promise<any> {
  await rateLimiter.waitIfNeeded()

  const url = new URL(BINANCE_BASE_URL + endpoint)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString())
  })

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      const errorData = await response.json()
      if (errorData.msg) {
        errorMessage = errorData.msg
      }
    } catch {
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

export function validateTradingSymbol(symbol: string): boolean {
  const symbolRegex = /^[A-Z]{2,10}USDT?$/
  return symbolRegex.test(symbol)
}

export async function getAvailableTradingPairs(): Promise<string[]> {
  try {
    const exchangeInfo = await fetchBinanceAPI(BINANCE_ENDPOINTS.EXCHANGE_INFO)

    return exchangeInfo.symbols
      .filter(
        (symbol: any) =>
          symbol.status === "TRADING" && (symbol.symbol.endsWith("USDT") || symbol.symbol.endsWith("USDC")),
      )
      .map((symbol: any) => symbol.symbol)
      .sort()
  } catch (error) {
    console.error("Error fetching trading pairs:", error)
    return []
  }
}

export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`
  }
  return volume.toFixed(2)
}

export function calculatePriceChangePercent(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}
