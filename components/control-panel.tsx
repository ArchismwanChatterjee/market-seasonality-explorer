"use client"

import { useState } from "react"
import { Calendar, BarChart3, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ViewMode } from "@/types/market"
import { format, addMonths, subMonths, isFuture, startOfMonth } from "date-fns"
import { QuickDatePicker } from "@/components/quick-date-picker"

interface ControlPanelProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  currentMonth: Date
  onMonthChange: (month: Date) => void
}

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

export function ControlPanel({
  viewMode,
  onViewModeChange,
  selectedSymbol,
  onSymbolChange,
  currentMonth,
  onMonthChange,
}: ControlPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const viewModeOptions = [
    { value: "daily" as ViewMode, label: "Daily View", shortLabel: "Daily", icon: Calendar },
    { value: "weekly" as ViewMode, label: "Weekly View", shortLabel: "Weekly", icon: BarChart3 },
    { value: "monthly" as ViewMode, label: "Monthly View", shortLabel: "Monthly", icon: TrendingUp },
  ]

  // Check if next month would be in the future
  const nextMonth = addMonths(currentMonth, 1)
  const isNextMonthFuture = isFuture(startOfMonth(nextMonth))

  // Extended historical data range - Binance has data back to 2017 for major pairs
  const prevMonth = subMonths(currentMonth, 1)
  const binanceLaunchDate = new Date(2017, 6, 1) // July 2017 when Binance launched
  const isPrevMonthTooOld = prevMonth < binanceLaunchDate

  const handleNextMonth = () => {
    if (!isNextMonthFuture) {
      onMonthChange(nextMonth)
    }
  }

  const handlePrevMonth = () => {
    if (!isPrevMonthTooOld) {
      onMonthChange(prevMonth)
    }
  }

  const handleCurrentMonth = () => {
    const now = new Date()
    // Set to current month, but if we're early in the month, might want to show previous month
    // for better data availability
    const today = new Date()
    const currentDate = today.getDate()

    // If it's early in the month (first 3 days), default to previous month for better data
    if (currentDate <= 3) {
      onMonthChange(subMonths(today, 1))
    } else {
      onMonthChange(today)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* View Mode Selection */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm font-medium">View Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Mobile: Horizontal buttons */}
          <div className="flex sm:hidden space-x-1">
            {viewModeOptions.map(({ value, shortLabel, icon: Icon }) => (
              <Button
                key={value}
                variant={viewMode === value ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs px-2"
                onClick={() => onViewModeChange(value)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {shortLabel}
              </Button>
            ))}
          </div>

          {/* Desktop: Vertical buttons */}
          <div className="hidden sm:flex sm:flex-col space-y-2">
            {viewModeOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={viewMode === value ? "default" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => onViewModeChange(value)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Symbol Selection */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm font-medium">Trading Pair</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSymbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRYPTO_SYMBOLS.map((symbol) => (
                <SelectItem key={symbol.value} value={symbol.value}>
                  <span className="hidden sm:inline">{symbol.label}</span>
                  <span className="sm:hidden">{symbol.shortLabel}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Time Navigation */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm font-medium">Time Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {/* Quick Date Picker */}
          <div className="space-y-2">
            <QuickDatePicker
              currentMonth={currentMonth}
              onMonthChange={onMonthChange}
              className="w-full text-xs sm:text-sm"
            />

            {isFuture(startOfMonth(currentMonth)) && (
              <div className="text-xs text-muted-foreground text-orange-600">Future month - limited data available</div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 bg-transparent text-xs"
              onClick={handlePrevMonth}
              disabled={isPrevMonthTooOld}
              title={isPrevMonthTooOld ? "Cannot go further back than July 2017" : "Previous month"}
            >
              <ChevronLeft className="h-3 w-3" />
              <span>Prev</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 bg-transparent text-xs"
              onClick={handleNextMonth}
              disabled={isNextMonthFuture}
              title={isNextMonthFuture ? "Cannot view future months" : "Next month"}
            >
              <span>Next</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Date Range Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>Historical data available</div>
            <div>
              from {format(binanceLaunchDate, "MMM yyyy")} to {format(new Date(), "MMM yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm font-medium">Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          <div>
            <div className="text-xs font-medium mb-2">Volatility Colors</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded"></div>
                <span className="text-xs">Low (&lt; 1%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded"></div>
                <span className="text-xs">Medium (1-2%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded"></div>
                <span className="text-xs">High (&gt; 2%)</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2">Indicators</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 text-green-500" />
                <span className="text-xs">
                  <span className="hidden sm:inline">Positive Performance</span>
                  <span className="sm:hidden">Positive</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 text-red-500 rotate-180" />
                <span className="text-xs">
                  <span className="hidden sm:inline">Negative Performance</span>
                  <span className="sm:hidden">Negative</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-0.5 sm:w-3 sm:h-1 bg-foreground/60 rounded"></div>
                <span className="text-xs">Volume Bar</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
