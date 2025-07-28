"use client"

import { useState, useMemo } from "react"
import { TrendingUp, Calendar, BarChart3, Zap, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { MarketData } from "@/types/market"
import { getDay, getDate } from "date-fns"
import { useTheme } from "@/contexts/theme-context"

interface Pattern {
  id: string
  type: "weekly" | "monthly" | "volatility" | "volume" | "anomaly"
  name: string
  description: string
  confidence: number
  occurrences: number
  avgImpact: number
  severity?: "low" | "medium" | "high"
}

interface PatternAnalyzerProps {
  data: MarketData[]
  symbol: string
  historicalData?: MarketData[]
  expandedView?: boolean
}

export function PatternAnalyzer({ data, symbol, historicalData = [], expandedView = false }: PatternAnalyzerProps) {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null)
  const { getSeverityColor } = useTheme()

  const patterns = useMemo(() => {
    const allData = [...historicalData, ...data]
    if (allData.length < 30) return []

    const detectedPatterns: Pattern[] = []

    // Weekly patterns - analyze by day of week
    const weeklyData = allData.reduce(
      (acc, item) => {
        const dayOfWeek = getDay(new Date(item.date))
        if (!acc[dayOfWeek]) acc[dayOfWeek] = []
        acc[dayOfWeek].push(item)
        return acc
      },
      {} as Record<number, MarketData[]>,
    )

    // Find most volatile day of week
    const weeklyVolatility = Object.entries(weeklyData).map(([day, dayData]) => ({
      day: Number.parseInt(day),
      avgVolatility: dayData.reduce((sum, item) => sum + item.volatility, 0) / dayData.length,
      count: dayData.length,
    }))

    const mostVolatileDay = weeklyVolatility.reduce((max, current) =>
      current.avgVolatility > max.avgVolatility ? current : max,
    )

    if (mostVolatileDay.avgVolatility > 2 && mostVolatileDay.count >= 4) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      detectedPatterns.push({
        id: "weekly-volatility",
        type: "weekly",
        name: `${dayNames[mostVolatileDay.day]} Volatility`,
        description: `Higher volatility typically occurs on ${dayNames[mostVolatileDay.day]}s`,
        confidence: Math.min(95, (mostVolatileDay.count / allData.length) * 100 * 7),
        occurrences: mostVolatileDay.count,
        avgImpact: mostVolatileDay.avgVolatility,
        severity: mostVolatileDay.avgVolatility > 3 ? "high" : "medium",
      })
    }

    // Monthly patterns - analyze by day of month
    const monthlyData = allData.reduce(
      (acc, item) => {
        const dayOfMonth = getDate(new Date(item.date))
        const period = dayOfMonth <= 10 ? "early" : dayOfMonth <= 20 ? "mid" : "late"
        if (!acc[period]) acc[period] = []
        acc[period].push(item)
        return acc
      },
      {} as Record<string, MarketData[]>,
    )

    // Find patterns in monthly periods
    Object.entries(monthlyData).forEach(([period, periodData]) => {
      const avgVolatility = periodData.reduce((sum, item) => sum + item.volatility, 0) / periodData.length
      const avgReturn =
        periodData.length > 0
          ? periodData.reduce((sum, item) => sum + ((item.close - item.open) / item.open) * 100, 0) / periodData.length
          : 0

      if (Math.abs(avgReturn) > 1 && periodData.length >= 5) {
        detectedPatterns.push({
          id: `monthly-${period}`,
          type: "monthly",
          name: `${period.charAt(0).toUpperCase() + period.slice(1)}-Month ${avgReturn > 0 ? "Rally" : "Decline"}`,
          description: `${period === "early" ? "Early" : period === "mid" ? "Mid" : "Late"} month periods show ${avgReturn > 0 ? "positive" : "negative"} performance tendency`,
          confidence: Math.min(90, (periodData.length / allData.length) * 100 * 3),
          occurrences: periodData.length,
          avgImpact: Math.abs(avgReturn),
          severity: Math.abs(avgReturn) > 3 ? "high" : Math.abs(avgReturn) > 1.5 ? "medium" : "low",
        })
      }
    })

    // Volatility clustering
    let clusterCount = 0
    let inCluster = false
    for (let i = 1; i < allData.length; i++) {
      const current = allData[i].volatility
      const previous = allData[i - 1].volatility

      if (current > 2 && previous > 2) {
        if (!inCluster) {
          clusterCount++
          inCluster = true
        }
      } else {
        inCluster = false
      }
    }

    if (clusterCount >= 3) {
      detectedPatterns.push({
        id: "volatility-clustering",
        type: "volatility",
        name: "Volatility Clustering",
        description: "High volatility periods tend to be followed by more high volatility",
        confidence: Math.min(85, (clusterCount / (allData.length / 10)) * 100),
        occurrences: clusterCount,
        avgImpact:
          allData.filter((item) => item.volatility > 2).reduce((sum, item) => sum + item.volatility, 0) /
          allData.filter((item) => item.volatility > 2).length,
        severity: "medium",
      })
    }

    // Volume spikes pattern
    const avgVolume = allData.reduce((sum, item) => sum + item.volume, 0) / allData.length
    const volumeSpikes = allData.filter((item) => item.volume > avgVolume * 2)

    if (volumeSpikes.length >= 3) {
      detectedPatterns.push({
        id: "volume-spikes",
        type: "volume",
        name: "Volume Spikes",
        description: "Periodic volume spikes indicate increased market interest",
        confidence: Math.min(80, (volumeSpikes.length / allData.length) * 100 * 10),
        occurrences: volumeSpikes.length,
        avgImpact: volumeSpikes.reduce((sum, item) => sum + item.volume, 0) / volumeSpikes.length / avgVolume,
        severity: "low",
      })
    }

    // Anomaly detection - extreme price movements
    const priceChanges = allData.map((item) => ((item.close - item.open) / item.open) * 100)
    const avgChange = priceChanges.reduce((sum, change) => sum + Math.abs(change), 0) / priceChanges.length
    const anomalies = allData.filter((item) => {
      const change = Math.abs(((item.close - item.open) / item.open) * 100)
      return change > avgChange * 3
    })

    if (anomalies.length >= 2) {
      detectedPatterns.push({
        id: "price-anomalies",
        type: "anomaly",
        name: "Price Anomalies",
        description: "Unusual price movements detected that deviate significantly from normal patterns",
        confidence: Math.min(75, (anomalies.length / allData.length) * 100 * 20),
        occurrences: anomalies.length,
        avgImpact:
          anomalies.reduce((sum, item) => sum + Math.abs(((item.close - item.open) / item.open) * 100), 0) /
          anomalies.length,
        severity: "high",
      })
    }

    return detectedPatterns.sort((a, b) => b.confidence - a.confidence)
  }, [data, historicalData])

  const getPatternIcon = (type: Pattern["type"]) => {
    switch (type) {
      case "weekly":
        return <Calendar className="h-4 w-4" />
      case "monthly":
        return <TrendingUp className="h-4 w-4" />
      case "volatility":
        return <Zap className="h-4 w-4" />
      case "volume":
        return <BarChart3 className="h-4 w-4" />
      case "anomaly":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-500"
    if (confidence >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  // Determine how many patterns to show based on expanded view
  const patternsToShow = expandedView ? 5 : 3

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Zap className="h-4 w-4" />
          <span>Pattern Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {patterns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Insufficient data for pattern analysis. Need more historical data to detect recurring patterns.
          </p>
        ) : (
          patterns.slice(0, patternsToShow).map((pattern) => (
            <Dialog key={pattern.id}>
              <DialogTrigger asChild>
                <div
                  className={`p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${getSeverityColor(pattern.severity)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getPatternIcon(pattern.type)}
                      <span className="font-medium text-sm">{pattern.name}</span>
                      {pattern.type === "anomaly" && (
                        <Badge variant="destructive" className="text-xs">
                          Anomaly
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className={getConfidenceColor(pattern.confidence)}>
                      {pattern.confidence.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pattern.description}</p>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    {getPatternIcon(pattern.type)}
                    <span>{pattern.name}</span>
                    {pattern.severity && (
                      <Badge
                        variant={
                          pattern.severity === "high"
                            ? "destructive"
                            : pattern.severity === "medium"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {pattern.severity} severity
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>{pattern.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Confidence Level</div>
                      <div className={`text-lg font-bold ${getConfidenceColor(pattern.confidence)}`}>
                        {pattern.confidence.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Occurrences</div>
                      <div className="text-lg font-bold">{pattern.occurrences}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Average Impact</div>
                    <div className="text-lg font-bold">
                      {pattern.avgImpact.toFixed(2)}
                      {pattern.type === "volume" ? "x" : "%"}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      This pattern has been observed {pattern.occurrences} times in the analyzed data with a confidence
                      level of {pattern.confidence.toFixed(1)}%. The average impact is {pattern.avgImpact.toFixed(2)}
                      {pattern.type === "volume" ? "x normal volume" : "% change"}.
                    </p>
                    {pattern.type === "anomaly" && (
                      <p className="mt-2 text-orange-600 dark:text-orange-400">
                        <strong>Note:</strong> Anomalies represent unusual market behavior that may indicate significant
                        events or market inefficiencies.
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))
        )}

        {patterns.length > patternsToShow && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                View All {patterns.length} Patterns
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>All Detected Patterns ({patterns.length})</span>
                </DialogTitle>
                <DialogDescription>
                  Complete analysis of all recurring patterns detected in the market data
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {patterns.map((pattern) => (
                  <Card key={pattern.id} className={`${getSeverityColor(pattern.severity)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getPatternIcon(pattern.type)}
                          <div>
                            <h3 className="font-semibold text-base">{pattern.name}</h3>
                            <p className="text-sm text-muted-foreground">{pattern.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {pattern.type === "anomaly" && (
                            <Badge variant="destructive" className="text-xs">
                              Anomaly
                            </Badge>
                          )}
                          {pattern.severity && (
                            <Badge
                              variant={
                                pattern.severity === "high"
                                  ? "destructive"
                                  : pattern.severity === "medium"
                                    ? "secondary"
                                    : "default"
                              }
                              className="text-xs"
                            >
                              {pattern.severity} severity
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${getConfidenceColor(pattern.confidence)}`}>
                            {pattern.confidence.toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-2 bg-muted/20 rounded">
                          <div className="text-muted-foreground text-xs">Occurrences</div>
                          <div className="font-bold text-lg">{pattern.occurrences}</div>
                        </div>
                        <div className="text-center p-2 bg-muted/20 rounded">
                          <div className="text-muted-foreground text-xs">Average Impact</div>
                          <div className="font-bold text-lg">
                            {pattern.avgImpact.toFixed(2)}
                            {pattern.type === "volume" ? "x" : "%"}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-muted/20 rounded">
                          <div className="text-muted-foreground text-xs">Pattern Type</div>
                          <div className="font-bold text-sm capitalize">{pattern.type}</div>
                        </div>
                      </div>

                      {pattern.type === "anomaly" && (
                        <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded">
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            <strong>⚠️ Anomaly Alert:</strong> This pattern represents unusual market behavior that
                            significantly deviates from normal trading patterns. Such anomalies may indicate major
                            market events, news impacts, or potential trading opportunities.
                          </div>
                        </div>
                      )}

                      {pattern.type === "weekly" && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            <strong>📅 Weekly Pattern:</strong> This pattern occurs on specific days of the week, which
                            could be related to market opening/closing cycles, institutional trading patterns, or
                            regular market events.
                          </div>
                        </div>
                      )}

                      {pattern.type === "monthly" && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                          <div className="text-xs text-green-600 dark:text-green-400">
                            <strong>📊 Monthly Pattern:</strong> This pattern is related to monthly market cycles,
                            possibly influenced by options expiry, salary payments, institutional rebalancing, or
                            end-of-month trading activities.
                          </div>
                        </div>
                      )}

                      {pattern.type === "volatility" && (
                        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded">
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            <strong>⚡ Volatility Pattern:</strong> This pattern shows how market volatility tends to
                            cluster together. High volatility periods are often followed by more high volatility,
                            indicating market uncertainty or major events.
                          </div>
                        </div>
                      )}

                      {pattern.type === "volume" && (
                        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded">
                          <div className="text-xs text-indigo-600 dark:text-indigo-400">
                            <strong>📈 Volume Pattern:</strong> This pattern indicates periods of unusually high trading
                            volume, which often correlates with increased market interest, news events, or significant
                            price movements.
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {patterns.length === 0 && (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No patterns detected in the current dataset.</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      More historical data is needed to identify recurring market patterns.
                    </p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Pattern Analysis Notes:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>
                      • <strong>Confidence Level:</strong> Higher percentages indicate more reliable patterns
                    </li>
                    <li>
                      • <strong>Occurrences:</strong> Number of times this pattern was observed in the data
                    </li>
                    <li>
                      • <strong>Average Impact:</strong> Typical magnitude of the pattern's effect
                    </li>
                    <li>
                      • <strong>Severity:</strong> Indicates the potential market impact of the pattern
                    </li>
                    <li>• Patterns are detected using statistical analysis of historical price and volume data</li>
                    <li>• Past patterns do not guarantee future performance - use for informational purposes only</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
