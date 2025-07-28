export type ViewMode = "daily" | "weekly" | "monthly"

export interface MarketData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  volatility: number
}

export interface TimeRange {
  start: Date
  end: Date
}

export interface MarketMetrics {
  volatility: number
  volume: number
  performance: number
  liquidity: number
}
