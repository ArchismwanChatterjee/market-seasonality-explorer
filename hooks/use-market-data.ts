"use client"

import { useState, useEffect, useCallback } from "react"
import type { MarketData, ViewMode } from "@/types/market"
import { format, startOfMonth, endOfMonth, subDays, differenceInDays } from "date-fns"

interface UseMarketDataProps {
  symbol: string
  viewMode: ViewMode
  month: Date
}

interface UseMarketDataReturn {
  data: MarketData[]
  loading: boolean
  error: string | null
  refetch: () => void
}

interface BinanceKlineData {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  numberOfTrades: number
  takerBuyBaseAssetVolume: string
  takerBuyQuoteAssetVolume: string
  ignore: string
}

const BINANCE_BASE_URL = "https://api.binance.com/api/v3"
const BINANCE_LAUNCH_DATE = new Date(2017, 6, 1) 

const calculateVolatility = (prices: number[]): number => {
  try {
    if (!Array.isArray(prices) || prices.length < 2) return 0

    const validPrices = prices.filter((price) => typeof price === "number" && !isNaN(price) && price > 0)

    if (validPrices.length < 2) return 0

    const returns = []
    for (let i = 1; i < validPrices.length; i++) {
      const returnValue = (validPrices[i] - validPrices[i - 1]) / validPrices[i - 1]
      if (!isNaN(returnValue) && isFinite(returnValue)) {
        returns.push(returnValue)
      }
    }

    if (returns.length === 0) return 0

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length

    const volatility = Math.sqrt(variance) * 100 

    return isNaN(volatility) || !isFinite(volatility) ? 0 : volatility
  } catch (error) {
    console.warn("Error calculating volatility:", error)
    return 0
  }
}

const fetchBinanceKlineData = async (symbol: string, startTime: number, endTime: number): Promise<MarketData[]> => {
  try {
    if (!startTime || !endTime || startTime >= endTime) {
      throw new Error("Invalid date range provided")
    }

    if (endTime < BINANCE_LAUNCH_DATE.getTime()) {
      console.warn(`Requested date range is before Binance launch (July 2017)`)
      return []
    }

    const adjustedStartTime = Math.max(startTime, BINANCE_LAUNCH_DATE.getTime())

    const validStartTime = Math.floor(adjustedStartTime)
    const validEndTime = Math.floor(endTime)

    console.log(
      `Fetching ${symbol} data from ${new Date(validStartTime).toISOString()} to ${new Date(validEndTime).toISOString()}`,
    )

    const url = `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=1d&startTime=${validStartTime}&endTime=${validEndTime}&limit=1000`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      let errorMessage = `Binance API error: ${response.status} ${response.statusText}`

      try {
        const errorData = await response.json()
        if (errorData.msg) {
          errorMessage = `Binance API: ${errorData.msg}`
        }
      } catch {
      }

      throw new Error(errorMessage)
    }

    const klineData: any[] = await response.json()

    if (!Array.isArray(klineData)) {
      throw new Error("Invalid response format from Binance API")
    }

    if (klineData.length === 0) {
      console.warn(`No data returned for ${symbol} in the specified date range`)
      return []
    }

    console.log(`Received ${klineData.length} kline records for ${symbol}`)

    return klineData
      .map((kline, index) => {
     
        if (!Array.isArray(kline) || kline.length < 11) {
          console.warn(`Invalid kline data structure at index ${index}:`, kline)
          return null
        }

        const [
          openTime,
          open,
          high,
          low,
          close,
          volume,
          closeTime,
          quoteAssetVolume,
          numberOfTrades,
          takerBuyBaseAssetVolume,
          takerBuyQuoteAssetVolume,
        ] = kline

        const openPrice = Number.parseFloat(open)
        const highPrice = Number.parseFloat(high)
        const lowPrice = Number.parseFloat(low)
        const closePrice = Number.parseFloat(close)
        const volumeValue = Number.parseFloat(volume)

        if (isNaN(openPrice) || isNaN(highPrice) || isNaN(lowPrice) || isNaN(closePrice) || isNaN(volumeValue)) {
          console.warn(`Invalid numeric data in kline at index ${index}:`, kline)
          return null
        }

        if (openPrice <= 0 || highPrice <= 0 || lowPrice <= 0 || closePrice <= 0) {
          console.warn(`Invalid price values (must be positive) at index ${index}:`, kline)
          return null
        }

        if (highPrice < Math.max(openPrice, closePrice) || lowPrice > Math.min(openPrice, closePrice)) {
          console.warn(`Invalid price relationships at index ${index}:`, kline)
          return null
        }

        const timestamp = Number(openTime)
        if (isNaN(timestamp) || timestamp <= 0) {
          console.warn(`Invalid timestamp in kline at index ${index}:`, openTime)
          return null
        }

        const dailyVolatility = openPrice > 0 ? ((highPrice - lowPrice) / openPrice) * 100 : 0

        const date = new Date(timestamp)
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date created from timestamp at index ${index}:`, timestamp)
          return null
        }

        if (date < BINANCE_LAUNCH_DATE) {
          console.warn(`Date before Binance launch at index ${index}:`, date)
          return null
        }

        return {
          date: format(date, "yyyy-MM-dd"),
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          close: closePrice,
          volume: volumeValue,
          volatility: Math.max(0, dailyVolatility), 
        }
      })
      .filter((item): item is MarketData => item !== null) 
  } catch (error) {
    console.error("Error fetching Binance kline data:", error)
    throw error
  }
}

const enhanceVolatilityData = (data: MarketData[]): MarketData[] => {
  if (data.length < 2) return data 

  return data.map((item, index) => {
    try {
      const windowSize = Math.min(7, index + 1)
      const windowStart = Math.max(0, index - windowSize + 1)
      const window = data.slice(windowStart, index + 1)

      const validWindow = window.filter((d) => d && typeof d.close === "number" && !isNaN(d.close) && d.close > 0)

      if (validWindow.length < 2) {
        return {
          ...item,
          volatility: Math.max(0, item.volatility || 0),
        }
      }

      const closePrices = validWindow.map((d) => d.close)

      const rollingVolatility = calculateVolatility(closePrices)

      const dailyWeight = 0.6
      const rollingWeight = 0.4

      const dailyVol = Math.max(0, item.volatility || 0)
      const rollingVol = Math.max(0, rollingVolatility || 0)

      const enhancedVolatility = dailyVol * dailyWeight + rollingVol * rollingWeight

      return {
        ...item,
        volatility: enhancedVolatility,
      }
    } catch (error) {
      console.warn("Error enhancing volatility for item:", item, error)
      return {
        ...item,
        volatility: Math.max(0, item.volatility || 0),
      }
    }
  })
}

export function useMarketData({ symbol, viewMode, month }: UseMarketDataProps): UseMarketDataReturn {
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (month < BINANCE_LAUNCH_DATE) {
        console.warn(`Requested month ${format(month, "yyyy-MM")} is before Binance launch`)
        setData([])
        setError(`No data available before ${format(BINANCE_LAUNCH_DATE, "MMMM yyyy")} (Binance launch date)`)
        return
      }

      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const extendedStart = subDays(monthStart, 30) 
      const actualStartDate = extendedStart > BINANCE_LAUNCH_DATE ? extendedStart : BINANCE_LAUNCH_DATE

      const startTime = actualStartDate.getTime()
      const endTime = monthEnd.getTime()

      if (isNaN(startTime) || isNaN(endTime)) {
        throw new Error("Invalid date calculation")
      }

      if (startTime >= endTime) {
        throw new Error("Start date must be before end date")
      }

      if (!symbol || symbol.length < 6) {
        throw new Error("Invalid trading symbol format")
      }

      const daysDifference = differenceInDays(monthEnd, actualStartDate)
      if (daysDifference > 1000) {
        throw new Error("Date range too large. Please select a more recent period.")
      }

      console.log(
        `Fetching data for ${symbol} from ${format(actualStartDate, "yyyy-MM-dd")} to ${format(monthEnd, "yyyy-MM-dd")} (${daysDifference} days)`,
      )

      const klineData = await fetchBinanceKlineData(symbol, startTime, endTime)

      if (klineData.length === 0) {
        const errorMsg = `No trading data available for ${symbol} in ${format(month, "MMMM yyyy")}. This symbol may not have existed or been trading during this time period.`
        setError(errorMsg)
        setData([])
        return
      }

      const enhancedData = enhanceVolatilityData(klineData)

      const filteredData = enhancedData.filter((item) => {
        try {
          const itemDate = new Date(item.date)
          if (isNaN(itemDate.getTime())) {
            console.warn("Invalid date in filtered data:", item.date)
            return false
          }
          return itemDate >= monthStart && itemDate <= monthEnd
        } catch (error) {
          console.warn("Error filtering date:", item.date, error)
          return false
        }
      })

      console.log(
        `Successfully processed ${filteredData.length} days of data for ${symbol} in ${format(month, "MMMM yyyy")}`,
      )

      if (filteredData.length === 0) {
        const errorMsg = `No data available for ${symbol} in ${format(month, "MMMM yyyy")}. The symbol may not have been trading during this period.`
        setError(errorMsg)
        setData([])
        return
      }

      setData(filteredData)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch market data from Binance API"
      console.error("Market data fetch error:", errorMessage)
      setError(errorMessage)

      setData([])
    } finally {
      setLoading(false)
    }
  }, [symbol, viewMode, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}
