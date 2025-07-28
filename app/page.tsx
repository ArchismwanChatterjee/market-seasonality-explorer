"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar } from "@/components/calendar"
import { DataDashboard } from "@/components/data-dashboard"
import { ControlPanel } from "@/components/control-panel"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ExportDialog } from "@/components/export-dialog"
import { ComparisonDialog } from "@/components/comparison-dialog"
import { AlertSystem } from "@/components/alert-system"
import { PatternAnalyzer } from "@/components/pattern-analyzer"
import { ColorSchemeSettings } from "@/components/color-scheme-settings"
import { useMarketData } from "@/hooks/use-market-data"
import type { ViewMode, TimeRange, MarketData } from "@/types/market"
import { NetworkStatus } from "@/components/network-status"
import { ThemeProvider } from "@/contexts/theme-context"
import { subMonths } from "date-fns"
import { Menu, X, LayoutGrid, LayoutList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

function MarketSeasonalityExplorerContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily")
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<TimeRange | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [layoutMode, setLayoutMode] = useState<"default" | "expanded">("default")
  const calendarRef = useRef<HTMLDivElement>(null)

  // Initialize with previous month to ensure data availability
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    const currentDate = now.getDate()

    // If it's early in the month (first 3 days), default to previous month for better data
    if (currentDate <= 3) {
      return subMonths(now, 1)
    }
    return now
  })

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [historicalData, setHistoricalData] = useState<MarketData[]>([])

  const { data, loading, error, refetch } = useMarketData({
    symbol: selectedSymbol,
    viewMode,
    month: currentMonth,
  })

  useEffect(() => {
    if (!loading && !error && data.length > 0) {
      setLastUpdate(new Date())
      // Accumulate historical data for pattern analysis
      setHistoricalData((prev) => {
        const combined = [...prev, ...data]
        // Keep only last 6 months of data to prevent memory issues
        return combined.slice(-180)
      })
    }
  }, [loading, error, data])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedRange(null)
    // Close mobile menu when date is selected
    setIsMobileMenuOpen(false)
  }

  const handleRangeSelect = (range: TimeRange) => {
    setSelectedRange(range)
    setSelectedDate(null)
    setIsMobileMenuOpen(false)
  }

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol)
    setSelectedDate(null)
    setSelectedRange(null)
    setHistoricalData([]) // Reset historical data for new symbol
    setIsMobileMenuOpen(false)
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest(".mobile-menu")) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobileMenuOpen])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-destructive mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">{error}</p>
          <div className="space-y-2">
            <button
              onClick={refetch}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 w-full text-sm sm:text-base"
            >
              Retry
            </button>
            <p className="text-xs text-muted-foreground">
              Note: Market data is only available for past dates. Future dates will not have trading data.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading && !data.length) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Market Seasonality Explorer</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Loading historical market data from Binance API...
            </p>
          </div>
        </header>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                Market Seasonality Explorer
              </h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm lg:text-base hidden sm:block">
                Interactive calendar for visualizing historical market volatility, liquidity, and performance
              </p>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <div className="mr-4">
                <Tabs
                  value={layoutMode}
                  onValueChange={(value) => setLayoutMode(value as "default" | "expanded")}
                  className="w-[200px]"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="default" className="flex items-center space-x-1">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span>Standard</span>
                    </TabsTrigger>
                    <TabsTrigger value="expanded" className="flex items-center space-x-1">
                      <LayoutList className="h-3.5 w-3.5" />
                      <span>Expanded</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <ColorSchemeSettings />
              <ExportDialog data={data} symbol={selectedSymbol} currentMonth={currentMonth} calendarRef={calendarRef} />
              <ComparisonDialog currentData={data} currentMonth={currentMonth} symbol={selectedSymbol} />
              <AlertSystem data={data} symbol={selectedSymbol} />
              <NetworkStatus isLoading={loading} hasError={!!error} lastUpdate={lastUpdate} />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden ml-2 bg-transparent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile Actions Menu */}
          {isMobileMenuOpen && (
            <div className="mobile-menu lg:hidden mt-4 p-4 bg-muted/50 rounded-lg border">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <ColorSchemeSettings />
                <ExportDialog
                  data={data}
                  symbol={selectedSymbol}
                  currentMonth={currentMonth}
                  calendarRef={calendarRef}
                />
                <ComparisonDialog currentData={data} currentMonth={currentMonth} symbol={selectedSymbol} />
                <AlertSystem data={data} symbol={selectedSymbol} />
              </div>
              <div className="flex justify-center">
                <NetworkStatus isLoading={loading} hasError={!!error} lastUpdate={lastUpdate} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4">
          {/* Control Panel - Mobile */}
          <div className="space-y-4">
            <ControlPanel
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedSymbol={selectedSymbol}
              onSymbolChange={handleSymbolChange}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          </div>

          {/* Calendar - Mobile */}
          <div ref={calendarRef} className="bg-card rounded-lg border p-3 sm:p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64 sm:h-96">
                <LoadingSpinner />
              </div>
            ) : (
              <Calendar
                viewMode={viewMode}
                data={data}
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                selectedRange={selectedRange}
                onDateSelect={handleDateSelect}
                onRangeSelect={handleRangeSelect}
                onMonthChange={setCurrentMonth}
              />
            )}
          </div>

          {/* Data Dashboard - Mobile */}
          <div>
            <DataDashboard
              selectedDate={selectedDate}
              selectedRange={selectedRange}
              data={data}
              symbol={selectedSymbol}
              viewMode={viewMode}
            />
          </div>

          {/* Pattern Analyzer - Mobile */}
          <div>
            <PatternAnalyzer data={data} symbol={selectedSymbol} historicalData={historicalData} />
          </div>
        </div>

        {/* Desktop Layout - Default (3-column) */}
        {layoutMode === "default" && (
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
            {/* Control Panel - Desktop */}
            <div className="lg:col-span-1 space-y-4">
              <ControlPanel
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                selectedSymbol={selectedSymbol}
                onSymbolChange={handleSymbolChange}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
              <PatternAnalyzer data={data} symbol={selectedSymbol} historicalData={historicalData} />
            </div>

            {/* Calendar - Desktop */}
            <div className="lg:col-span-2">
              <div ref={calendarRef} className="bg-card rounded-lg border p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <Calendar
                    viewMode={viewMode}
                    data={data}
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    selectedRange={selectedRange}
                    onDateSelect={handleDateSelect}
                    onRangeSelect={handleRangeSelect}
                    onMonthChange={setCurrentMonth}
                  />
                )}
              </div>
            </div>

            {/* Data Dashboard - Desktop */}
            <div className="lg:col-span-1">
              <DataDashboard
                selectedDate={selectedDate}
                selectedRange={selectedRange}
                data={data}
                symbol={selectedSymbol}
                viewMode={viewMode}
              />
            </div>
          </div>
        )}

        {/* Desktop Layout - Expanded (2-row) */}
        {layoutMode === "expanded" && (
          <div className="hidden lg:block space-y-6">
            {/* Top Row: Calendar (Larger) + Control Panel */}
            <div className="grid grid-cols-4 gap-6">
              {/* Control Panel */}
              <div className="col-span-1">
                <ControlPanel
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  selectedSymbol={selectedSymbol}
                  onSymbolChange={handleSymbolChange}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              </div>

              {/* Calendar (Larger) */}
              <div className="col-span-3">
                <div ref={calendarRef} className="bg-card rounded-lg border p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-96">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <Calendar
                      viewMode={viewMode}
                      data={data}
                      currentMonth={currentMonth}
                      selectedDate={selectedDate}
                      selectedRange={selectedRange}
                      onDateSelect={handleDateSelect}
                      onRangeSelect={handleRangeSelect}
                      onMonthChange={setCurrentMonth}
                      expandedView={true}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Data Dashboard + Pattern Analyzer */}
            <div className="grid grid-cols-2 gap-6">
              {/* Data Dashboard */}
              <div className="col-span-1">
                <DataDashboard
                  selectedDate={selectedDate}
                  selectedRange={selectedRange}
                  data={data}
                  symbol={selectedSymbol}
                  viewMode={viewMode}
                  expandedView={true}
                />
              </div>

              {/* Pattern Analyzer */}
              <div className="col-span-1">
                <PatternAnalyzer
                  data={data}
                  symbol={selectedSymbol}
                  historicalData={historicalData}
                  expandedView={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MarketSeasonalityExplorer() {
  return (
    <ThemeProvider>
      <MarketSeasonalityExplorerContent />
    </ThemeProvider>
  )
}
