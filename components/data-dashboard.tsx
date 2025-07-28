"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { MarketData, ViewMode, TimeRange } from "@/types/market"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface DataDashboardProps {
  selectedDate: Date | null
  selectedRange: TimeRange | null
  data: MarketData[]
  symbol: string
  viewMode: ViewMode
  expandedView?: boolean
}

export function DataDashboard({
  selectedDate,
  selectedRange,
  data,
  symbol,
  viewMode,
  expandedView = false,
}: DataDashboardProps) {
  const selectedData = useMemo(() => {
    if (selectedDate) {
      return data.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate.toDateString() === selectedDate.toDateString()
      })
    }

    if (selectedRange) {
      return data.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= selectedRange.start && itemDate <= selectedRange.end
      })
    }

    return []
  }, [selectedDate, selectedRange, data])

  const aggregatedMetrics = useMemo(() => {
    if (selectedData.length === 0) return null

    const totalVolume = selectedData.reduce((sum, item) => sum + item.volume, 0)
    const avgVolatility = selectedData.reduce((sum, item) => sum + item.volatility, 0) / selectedData.length
    const totalReturn =
      selectedData.length > 0
        ? (((selectedData[selectedData.length - 1]?.close || 0) - (selectedData[0]?.open || 0)) /
            (selectedData[0]?.open || 1)) *
          100
        : 0

    const maxPrice = Math.max(...selectedData.map((item) => item.high))
    const minPrice = Math.min(...selectedData.map((item) => item.low))
    const priceRange = maxPrice - minPrice
    const avgPrice = selectedData.reduce((sum, item) => sum + (item.high + item.low) / 2, 0) / selectedData.length

    return {
      totalVolume,
      avgVolatility,
      totalReturn,
      maxPrice,
      minPrice,
      priceRange,
      avgPrice,
      tradingDays: selectedData.length,
    }
  }, [selectedData])

  const chartData = useMemo(() => {
    return selectedData.map((item) => ({
      date: format(new Date(item.date), "MMM d"),
      price: item.close,
      volume: item.volume / 1000000, // Convert to millions
      volatility: item.volatility,
      high: item.high,
      low: item.low,
    }))
  }, [selectedData])

  if (!selectedDate && !selectedRange) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6 sm:py-8">
            <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-xs sm:text-sm">Select a date or date range to view detailed market analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!aggregatedMetrics) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm font-medium">No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-muted-foreground">No market data available for the selected period.</p>
        </CardContent>
      </Card>
    )
  }

  // Determine chart heights based on expanded view
  const priceChartHeight = expandedView ? "h-40 sm:h-48" : "h-24 sm:h-32"
  const volumeChartHeight = expandedView ? "h-32 sm:h-40" : "h-20 sm:h-24"

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Market Analysis</span>
              <span className="sm:hidden">Analysis</span>
            </span>
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {selectedDate
              ? format(selectedDate, "MMMM d, yyyy")
              : selectedRange
                ? `${format(selectedRange.start, "MMM d")} - ${format(selectedRange.end, "MMM d, yyyy")}`
                : ""}
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className={expandedView ? "grid grid-cols-4 gap-2" : "grid grid-cols-2 gap-2"}>
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Avg Price</span>
                  <span className="sm:hidden">Price</span>
                </div>
                <div className="text-xs sm:text-sm font-medium truncate">
                  ${aggregatedMetrics.avgPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-2">
              {aggregatedMetrics.totalReturn >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Return</div>
                <div
                  className={`text-xs sm:text-sm font-medium truncate ${
                    aggregatedMetrics.totalReturn >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {aggregatedMetrics.totalReturn >= 0 ? "+" : ""}
                  {aggregatedMetrics.totalReturn.toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Volatility</span>
                  <span className="sm:hidden">Vol</span>
                </div>
                <div className="text-xs sm:text-sm font-medium truncate">
                  {aggregatedMetrics.avgVolatility.toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Volume</div>
                <div className="text-xs sm:text-sm font-medium truncate">
                  {(aggregatedMetrics.totalVolume / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs font-medium">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-red-500">Low: ${aggregatedMetrics.minPrice.toLocaleString()}</span>
            <span className="text-green-500">High: ${aggregatedMetrics.maxPrice.toLocaleString()}</span>
          </div>
          <Progress
            value={((aggregatedMetrics.avgPrice - aggregatedMetrics.minPrice) / aggregatedMetrics.priceRange) * 100}
            className="h-1 sm:h-2"
          />
          <div className="text-center text-xs text-muted-foreground">
            Range: ${aggregatedMetrics.priceRange.toLocaleString()}(
            {((aggregatedMetrics.priceRange / aggregatedMetrics.avgPrice) * 100).toFixed(1)}%)
          </div>
        </CardContent>
      </Card>

      {/* Price Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs font-medium">
              <span className="hidden sm:inline">Price Movement</span>
              <span className="sm:hidden">Price</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={priceChartHeight}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 8 }}
                    stroke="hsl(var(--muted-foreground))"
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" width={40} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volume Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs font-medium">
              <span className="hidden sm:inline">Volume (Millions)</span>
              <span className="sm:hidden">Volume (M)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={volumeChartHeight}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 8 }}
                    stroke="hsl(var(--muted-foreground))"
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs font-medium">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 sm:space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Trading Days:</span>
            <span className="font-medium">{aggregatedMetrics.tradingDays}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              <span className="hidden sm:inline">Avg Daily Volume:</span>
              <span className="sm:hidden">Avg Volume:</span>
            </span>
            <span className="font-medium">
              {(aggregatedMetrics.totalVolume / aggregatedMetrics.tradingDays / 1000000).toFixed(1)}M
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              <span className="hidden sm:inline">Volatility Level:</span>
              <span className="sm:hidden">Vol Level:</span>
            </span>
            <Badge
              variant={
                aggregatedMetrics.avgVolatility > 2
                  ? "destructive"
                  : aggregatedMetrics.avgVolatility > 1
                    ? "secondary"
                    : "default"
              }
              className="text-xs"
            >
              {aggregatedMetrics.avgVolatility > 2 ? "High" : aggregatedMetrics.avgVolatility > 1 ? "Medium" : "Low"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
