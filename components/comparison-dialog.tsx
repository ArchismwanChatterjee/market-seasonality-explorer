"use client"

import { useState } from "react"
import { GitCompare, Calendar, TrendingUp, BarChart3, CalendarDays, ArrowRightLeft, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MarketData } from "@/types/market"
import { format, subMonths, startOfMonth, endOfMonth, isFuture } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ComparisonDialogProps {
  currentData: MarketData[]
  currentMonth: Date
  symbol: string
}

// Available trading pairs for comparison
const CRYPTO_SYMBOLS = [
  { value: "BTCUSDT", label: "Bitcoin (BTC/USDT)", shortLabel: "BTC" },
  { value: "ETHUSDT", label: "Ethereum (ETH/USDT)", shortLabel: "ETH" },
  { value: "BNBUSDT", label: "Binance Coin (BNB/USDT)", shortLabel: "BNB" },
  { value: "ADAUSDT", label: "Cardano (ADA/USDT)", shortLabel: "ADA" },
  { value: "SOLUSDT", label: "Solana (SOL/USDT)", shortLabel: "SOL" },
  { value: "XRPUSDT", label: "Ripple (XRP/USDT)", shortLabel: "XRP" },
  { value: "DOTUSDT", label: "Polkadot (DOT/USDT)", shortLabel: "DOT" },
  { value: "AVAXUSDT", label: "Avalanche (AVAX/USDT)", shortLabel: "AVAX" },
  { value: "MATICUSDT", label: "Polygon (MATIC/USDT)", shortLabel: "MATIC" },
  { value: "LINKUSDT", label: "Chainlink (LINK/USDT)", shortLabel: "LINK" },
  { value: "UNIUSDT", label: "Uniswap (UNI/USDT)", shortLabel: "UNI" },
  { value: "LTCUSDT", label: "Litecoin (LTC/USDT)", shortLabel: "LTC" },
  { value: "BCHUSDT", label: "Bitcoin Cash (BCH/USDT)", shortLabel: "BCH" },
  { value: "XLMUSDT", label: "Stellar (XLM/USDT)", shortLabel: "XLM" },
  { value: "VETUSDT", label: "VeChain (VET/USDT)", shortLabel: "VET" },
]

// Binance API fetch function
const fetchBinanceData = async (symbol: string, startTime: number, endTime: number): Promise<MarketData[]> => {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1000`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }

    const klineData: any[] = await response.json()

    return klineData
      .map((kline) => {
        if (!Array.isArray(kline) || kline.length < 11) return null

        const [openTime, open, high, low, close, volume] = kline

        const openPrice = Number.parseFloat(open)
        const highPrice = Number.parseFloat(high)
        const lowPrice = Number.parseFloat(low)
        const closePrice = Number.parseFloat(close)
        const volumeValue = Number.parseFloat(volume)

        if (isNaN(openPrice) || isNaN(highPrice) || isNaN(lowPrice) || isNaN(closePrice) || isNaN(volumeValue)) {
          return null
        }

        const timestamp = Number(openTime)
        if (isNaN(timestamp) || timestamp <= 0) return null

        const date = new Date(timestamp)
        if (isNaN(date.getTime())) return null

        const dailyVolatility = openPrice > 0 ? ((highPrice - lowPrice) / openPrice) * 100 : 0

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
    console.error("Error fetching comparison data:", error)
    throw error
  }
}

// Generate month/year options for the last 5 years
const generateMonthYearOptions = () => {
  const options = []
  const now = new Date()

  for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
    const year = now.getFullYear() - yearOffset

    for (let month = 11; month >= 0; month--) {
      const date = new Date(year, month, 1)

      // Don't include future months or the current month
      if (isFuture(date) || (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth())) {
        continue
      }

      options.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy"),
        date: date,
      })
    }
  }

  return options
}

export function ComparisonDialog({ currentData, currentMonth, symbol }: ComparisonDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comparisonType, setComparisonType] = useState<"time" | "symbol">("time")

  // Time-based comparison state
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("previous-month")
  const [customMonth, setCustomMonth] = useState<Date | null>(null)

  // Symbol-based comparison state
  const [comparisonSymbol, setComparisonSymbol] = useState<string>("")
  const [symbolComparisonPeriod, setSymbolComparisonPeriod] = useState<string>("same-period")
  const [symbolCustomMonth, setSymbolCustomMonth] = useState<Date | null>(null)

  const [comparisonData, setComparisonData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthYearOptions = generateMonthYearOptions()

  const getComparisonMonth = () => {
    if (comparisonType === "symbol") {
      switch (symbolComparisonPeriod) {
        case "same-period":
          return currentMonth
        case "previous-month":
          return subMonths(currentMonth, 1)
        case "previous-year":
          return subMonths(currentMonth, 12)
        case "custom":
          return symbolCustomMonth || currentMonth
        default:
          return currentMonth
      }
    } else {
      switch (comparisonPeriod) {
        case "previous-month":
          return subMonths(currentMonth, 1)
        case "previous-year":
          return subMonths(currentMonth, 12)
        case "two-months-ago":
          return subMonths(currentMonth, 2)
        case "custom":
          return customMonth || subMonths(currentMonth, 1)
        default:
          return subMonths(currentMonth, 1)
      }
    }
  }

  const getComparisonSymbol = () => {
    return comparisonType === "symbol" ? comparisonSymbol : symbol
  }

  const loadComparisonData = async () => {
    if (comparisonType === "symbol" && !comparisonSymbol) {
      setError("Please select a trading pair for comparison")
      return
    }

    if (comparisonType === "symbol" && comparisonSymbol === symbol && symbolComparisonPeriod === "same-period") {
      setError("Cannot compare the same trading pair with the same time period")
      return
    }

    if (comparisonPeriod === "custom" && !customMonth && comparisonType === "time") {
      setError("Please select a custom month for comparison")
      return
    }

    if (symbolComparisonPeriod === "custom" && !symbolCustomMonth && comparisonType === "symbol") {
      setError("Please select a custom month for symbol comparison")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const compMonth = getComparisonMonth()
      const compSymbol = getComparisonSymbol()
      const monthStart = startOfMonth(compMonth)
      const monthEnd = endOfMonth(compMonth)

      console.log(`Loading comparison data for ${compSymbol} in ${format(compMonth, "MMMM yyyy")}`)

      const data = await fetchBinanceData(compSymbol, monthStart.getTime(), monthEnd.getTime())

      if (data.length === 0) {
        throw new Error(`No data available for ${compSymbol} in ${format(compMonth, "MMMM yyyy")}`)
      }

      setComparisonData(data)
      console.log(`Loaded ${data.length} days of comparison data for ${compSymbol}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load comparison data"
      setError(errorMessage)
      setComparisonData([])
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (data: MarketData[]) => {
    if (data.length === 0) return null

    const avgVolatility = data.reduce((sum, item) => sum + item.volatility, 0) / data.length
    const totalVolume = data.reduce((sum, item) => sum + item.volume, 0)
    const totalReturn =
      data.length > 0 ? (((data[data.length - 1]?.close || 0) - (data[0]?.open || 0)) / (data[0]?.open || 1)) * 100 : 0
    const maxPrice = Math.max(...data.map((item) => item.high))
    const minPrice = Math.min(...data.map((item) => item.low))

    return {
      avgVolatility,
      totalVolume,
      totalReturn,
      maxPrice,
      minPrice,
      tradingDays: data.length,
    }
  }

  const currentMetrics = calculateMetrics(currentData)
  const comparisonMetrics = calculateMetrics(comparisonData)

  // Create aligned chart data with normalized prices for symbol comparison
  const chartData = []
  const maxLength = Math.max(currentData.length, comparisonData.length)

  // For symbol comparison, normalize prices to percentage change from start
  const normalizeForSymbolComparison = comparisonType === "symbol"
  const currentStartPrice = currentData[0]?.open || 1
  const comparisonStartPrice = comparisonData[0]?.open || 1

  for (let i = 0; i < maxLength; i++) {
    const currentItem = currentData[i]
    const compItem = comparisonData[i]

    let currentValue = currentItem?.close || null
    let comparisonValue = compItem?.close || null

    // Normalize to percentage change for symbol comparison
    if (normalizeForSymbolComparison && currentValue && comparisonValue) {
      currentValue = ((currentValue - currentStartPrice) / currentStartPrice) * 100
      comparisonValue = ((comparisonValue - comparisonStartPrice) / comparisonStartPrice) * 100
    }

    chartData.push({
      day: i + 1,
      current: currentValue,
      comparison: comparisonValue,
      currentVol: currentItem?.volatility || null,
      comparisonVol: compItem?.volatility || null,
    })
  }

  const getMetricChange = (current: number, comparison: number) => {
    const change = ((current - comparison) / comparison) * 100
    return {
      value: change,
      isPositive: change >= 0,
      formatted: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    }
  }

  const handleCustomMonthSelect = (monthValue: string) => {
    const selectedOption = monthYearOptions.find((option) => option.value === monthValue)
    if (selectedOption) {
      setCustomMonth(selectedOption.date)
    }
  }

  const handleSymbolCustomMonthSelect = (monthValue: string) => {
    const selectedOption = monthYearOptions.find((option) => option.value === monthValue)
    if (selectedOption) {
      setSymbolCustomMonth(selectedOption.date)
    }
  }

  const getCurrentSymbolInfo = () => {
    return CRYPTO_SYMBOLS.find((s) => s.value === symbol)
  }

  const getComparisonSymbolInfo = () => {
    return CRYPTO_SYMBOLS.find((s) => s.value === comparisonSymbol)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
          <GitCompare className="h-4 w-4" />
          <span>Compare</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Market Comparison</DialogTitle>
          <DialogDescription>Compare market data across different time periods or trading pairs</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Comparison Type Selection */}
          <Tabs value={comparisonType} onValueChange={(value: any) => setComparisonType(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="time" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Time Period</span>
              </TabsTrigger>
              <TabsTrigger value="symbol" className="flex items-center space-x-2">
                <Coins className="h-4 w-4" />
                <span>Trading Pair</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="time" className="space-y-4">
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm">
                      <strong>Time Period Comparison:</strong> Compare {getCurrentSymbolInfo()?.shortLabel} performance
                      across different months
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="comparison-period">Comparison Period</Label>
                  <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous-month">Previous Month</SelectItem>
                      <SelectItem value="two-months-ago">2 Months Ago</SelectItem>
                      <SelectItem value="previous-year">Same Month Last Year</SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>Custom Month</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {comparisonPeriod === "custom" && (
                  <div className="flex-1">
                    <Label htmlFor="custom-month">Select Month</Label>
                    <Select
                      value={customMonth ? format(customMonth, "yyyy-MM") : ""}
                      onValueChange={handleCustomMonthSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a month..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {monthYearOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={loadComparisonData} disabled={loading} className="mt-6">
                  {loading ? "Loading..." : "Load Comparison"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="symbol" className="space-y-4">
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Coins className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm">
                      <strong>Trading Pair Comparison:</strong> Compare different cryptocurrencies during the same or
                      different time periods
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="comparison-symbol">Trading Pair to Compare</Label>
                  <Select value={comparisonSymbol} onValueChange={setComparisonSymbol}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trading pair..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CRYPTO_SYMBOLS.filter((s) => s.value !== symbol).map((crypto) => (
                        <SelectItem key={crypto.value} value={crypto.value}>
                          {crypto.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="symbol-comparison-period">Time Period</Label>
                  <Select value={symbolComparisonPeriod} onValueChange={setSymbolComparisonPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="same-period">Same Period ({format(currentMonth, "MMM yyyy")})</SelectItem>
                      <SelectItem value="previous-month">Previous Month</SelectItem>
                      <SelectItem value="previous-year">Same Month Last Year</SelectItem>
                      <SelectItem value="custom">Custom Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {symbolComparisonPeriod === "custom" && (
                <div>
                  <Label htmlFor="symbol-custom-month">Select Custom Month</Label>
                  <Select
                    value={symbolCustomMonth ? format(symbolCustomMonth, "yyyy-MM") : ""}
                    onValueChange={handleSymbolCustomMonthSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a month..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {monthYearOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={loadComparisonData} disabled={loading} className="w-full">
                {loading ? "Loading..." : "Load Comparison"}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Show comparison info */}
          {comparisonType === "time" && comparisonPeriod !== "custom" && (
            <Card className="bg-muted/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Comparing <strong>{getCurrentSymbolInfo()?.shortLabel}</strong> in{" "}
                    <strong>{format(currentMonth, "MMMM yyyy")}</strong> vs{" "}
                    <strong>{format(getComparisonMonth(), "MMMM yyyy")}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {comparisonType === "symbol" && comparisonSymbol && (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">{getCurrentSymbolInfo()?.shortLabel}</Badge>
                      <span className="text-sm">{format(currentMonth, "MMM yyyy")}</span>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{getComparisonSymbolInfo()?.shortLabel}</Badge>
                      <span className="text-sm">{format(getComparisonMonth(), "MMM yyyy")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-500 bg-red-50 dark:bg-red-950">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-red-500 font-medium">Error loading comparison data:</div>
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</div>
              </CardContent>
            </Card>
          )}

          {currentMetrics && comparisonMetrics && !loading && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {getCurrentSymbolInfo()?.shortLabel} - {format(currentMonth, "MMM yyyy")}
                      </span>
                      <Badge variant="default">Current</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Avg Volatility:</span>
                      <span className="font-medium">{currentMetrics.avgVolatility.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Return:</span>
                      <span
                        className={`font-medium ${currentMetrics.totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {currentMetrics.totalReturn >= 0 ? "+" : ""}
                        {currentMetrics.totalReturn.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Volume:</span>
                      <span className="font-medium">{(currentMetrics.totalVolume / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Price Range:</span>
                      <span className="font-medium">
                        ${currentMetrics.minPrice.toFixed(0)} - ${currentMetrics.maxPrice.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trading Days:</span>
                      <span className="font-medium">{currentMetrics.tradingDays}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {getComparisonSymbolInfo()?.shortLabel || getCurrentSymbolInfo()?.shortLabel} -{" "}
                        {format(getComparisonMonth(), "MMM yyyy")}
                      </span>
                      <Badge variant={comparisonType === "symbol" ? "outline" : "secondary"}>
                        {comparisonType === "symbol" ? "Different Pair" : "Different Time"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Avg Volatility:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{comparisonMetrics.avgVolatility.toFixed(2)}%</span>
                        {(() => {
                          const change = getMetricChange(currentMetrics.avgVolatility, comparisonMetrics.avgVolatility)
                          return (
                            <span className={`text-xs ${change.isPositive ? "text-red-500" : "text-green-500"}`}>
                              ({change.formatted})
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Return:</span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-medium ${comparisonMetrics.totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {comparisonMetrics.totalReturn >= 0 ? "+" : ""}
                          {comparisonMetrics.totalReturn.toFixed(2)}%
                        </span>
                        {(() => {
                          const change = getMetricChange(currentMetrics.totalReturn, comparisonMetrics.totalReturn)
                          return (
                            <span className={`text-xs ${change.isPositive ? "text-green-500" : "text-red-500"}`}>
                              ({change.formatted})
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Volume:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{(comparisonMetrics.totalVolume / 1000000).toFixed(1)}M</span>
                        {(() => {
                          const change = getMetricChange(currentMetrics.totalVolume, comparisonMetrics.totalVolume)
                          return (
                            <span className={`text-xs ${change.isPositive ? "text-green-500" : "text-red-500"}`}>
                              ({change.formatted})
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Price Range:</span>
                      <span className="font-medium">
                        ${comparisonMetrics.minPrice.toFixed(0)} - ${comparisonMetrics.maxPrice.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trading Days:</span>
                      <span className="font-medium">{comparisonMetrics.tradingDays}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>
                        {comparisonType === "symbol" ? "Performance Comparison (% Change)" : "Price Comparison"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px",
                            }}
                            formatter={(value, name) => [
                              value
                                ? comparisonType === "symbol"
                                  ? `${Number(value).toFixed(2)}%`
                                  : `$${Number(value).toLocaleString()}`
                                : "No data",
                              name === "current"
                                ? `${getCurrentSymbolInfo()?.shortLabel} (Current)`
                                : `${getComparisonSymbolInfo()?.shortLabel || getCurrentSymbolInfo()?.shortLabel} (Comparison)`,
                            ]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="current"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            name={`${getCurrentSymbolInfo()?.shortLabel} (Current)`}
                            dot={false}
                            connectNulls={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="comparison"
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name={`${getComparisonSymbolInfo()?.shortLabel || getCurrentSymbolInfo()?.shortLabel} (Comparison)`}
                            dot={false}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Volatility Comparison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px",
                            }}
                            formatter={(value, name) => [
                              value ? `${Number(value).toFixed(2)}%` : "No data",
                              name === "currentVol"
                                ? `${getCurrentSymbolInfo()?.shortLabel} Volatility`
                                : `${getComparisonSymbolInfo()?.shortLabel || getCurrentSymbolInfo()?.shortLabel} Volatility`,
                            ]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="currentVol"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            name={`${getCurrentSymbolInfo()?.shortLabel} Volatility`}
                            dot={false}
                            connectNulls={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="comparisonVol"
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name={`${getComparisonSymbolInfo()?.shortLabel || getCurrentSymbolInfo()?.shortLabel} Volatility`}
                            dot={false}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary insights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Comparison Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Volatility Difference:</span>
                      <span
                        className={`font-medium ${
                          currentMetrics.avgVolatility > comparisonMetrics.avgVolatility
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {getCurrentSymbolInfo()?.shortLabel} is{" "}
                        {currentMetrics.avgVolatility > comparisonMetrics.avgVolatility
                          ? "more volatile"
                          : "less volatile"}{" "}
                        by {Math.abs(currentMetrics.avgVolatility - comparisonMetrics.avgVolatility).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance Difference:</span>
                      <span
                        className={`font-medium ${
                          currentMetrics.totalReturn > comparisonMetrics.totalReturn ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {getCurrentSymbolInfo()?.shortLabel} performed{" "}
                        {currentMetrics.totalReturn > comparisonMetrics.totalReturn ? "better" : "worse"} by{" "}
                        {Math.abs(currentMetrics.totalReturn - comparisonMetrics.totalReturn).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume Difference:</span>
                      <span
                        className={`font-medium ${
                          currentMetrics.totalVolume > comparisonMetrics.totalVolume
                            ? "text-blue-500"
                            : "text-orange-500"
                        }`}
                      >
                        {getCurrentSymbolInfo()?.shortLabel} had{" "}
                        {currentMetrics.totalVolume > comparisonMetrics.totalVolume ? "higher" : "lower"} volume by{" "}
                        {(Math.abs(currentMetrics.totalVolume - comparisonMetrics.totalVolume) / 1000000).toFixed(1)}M
                      </span>
                    </div>

                    {comparisonType === "symbol" && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xs text-green-600 dark:text-green-400">
                          <strong>Trading Pair Comparison:</strong> You're comparing {getCurrentSymbolInfo()?.label}{" "}
                          with {getComparisonSymbolInfo()?.label} during{" "}
                          {symbolComparisonPeriod === "same-period" ? "the same time period" : "different time periods"}
                          .
                          {comparisonType === "symbol" &&
                            " Price charts show percentage change from start of period for fair comparison."}
                        </div>
                      </div>
                    )}

                    {comparisonType === "time" && comparisonPeriod === "custom" && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          <strong>Custom Time Comparison:</strong> You're comparing {format(currentMonth, "MMMM yyyy")}{" "}
                          with {format(getComparisonMonth(), "MMMM yyyy")} - a{" "}
                          {Math.abs(currentMonth.getFullYear() - getComparisonMonth().getFullYear())} year and{" "}
                          {Math.abs(currentMonth.getMonth() - getComparisonMonth().getMonth())} month difference.
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Loading comparison data...</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
