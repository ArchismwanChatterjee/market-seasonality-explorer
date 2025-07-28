"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarCell } from "@/components/calendar-cell"
import { CalendarTooltip } from "@/components/calendar-tooltip"
import type { ViewMode, MarketData, TimeRange } from "@/types/market"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isFuture,
} from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CalendarProps {
  viewMode: ViewMode
  data: MarketData[]
  currentMonth: Date
  selectedDate: Date | null
  selectedRange: TimeRange | null
  onDateSelect: (date: Date) => void
  onRangeSelect: (range: TimeRange) => void
  onMonthChange: (month: Date) => void
  expandedView?: boolean
}

export function Calendar({
  viewMode,
  data,
  currentMonth,
  selectedDate,
  selectedRange,
  onDateSelect,
  onRangeSelect,
  onMonthChange,
  expandedView = false,
}: CalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weeks = eachWeekOfInterval({ start: calendarStart, end: calendarEnd })

  // Check if navigation should be disabled
  const nextMonth = addMonths(currentMonth, 1)
  const isNextMonthFuture = isFuture(startOfMonth(nextMonth))

  const prevMonth = subMonths(currentMonth, 1)
  const binanceLaunchDate = new Date(2017, 6, 1) // July 2017 when Binance launched
  const isPrevMonthTooOld = prevMonth < binanceLaunchDate

  const getDataForDate = useCallback(
    (date: Date) => {
      return data.find((item) => isSameDay(new Date(item.date), date))
    },
    [data],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!selectedDate) return

      let newDate = selectedDate
      switch (event.key) {
        case "ArrowLeft":
          newDate = new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000)
          break
        case "ArrowRight":
          newDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
          break
        case "ArrowUp":
          newDate = new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "ArrowDown":
          newDate = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case "Escape":
          onDateSelect(null as any)
          return
        default:
          return
      }

      event.preventDefault()

      // Don't allow selection of future dates or dates before Binance launch
      if (isFuture(newDate) || newDate < binanceLaunchDate) {
        return
      }

      onDateSelect(newDate)

      // Change month if necessary
      if (!isSameMonth(newDate, currentMonth)) {
        onMonthChange(newDate)
      }
    },
    [selectedDate, currentMonth, onDateSelect, onMonthChange],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleMouseEnter = (date: Date, event: React.MouseEvent) => {
    setHoveredDate(date)
    setTooltipPosition({ x: event.clientX, y: event.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredDate(null)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev" && !isPrevMonthTooOld) {
      onMonthChange(prevMonth)
    } else if (direction === "next" && !isNextMonthFuture) {
      onMonthChange(nextMonth)
    }
  }

  const handleDateClick = (date: Date) => {
    // Don't allow selection of future dates or dates before Binance launch
    if (isFuture(date) || date < binanceLaunchDate) {
      return
    }
    onDateSelect(date)
  }

  const renderDailyView = () => (
    <div className="space-y-4">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("prev")}
          className="h-8 w-8 p-0 shrink-0"
          disabled={isPrevMonthTooOld}
          title={isPrevMonthTooOld ? "Cannot go further back than July 2017" : "Previous month"}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center flex-1 min-w-0 mx-2">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            <Select
              value={currentMonth.getMonth().toString()}
              onValueChange={(monthStr) => {
                const month = Number.parseInt(monthStr)
                const newDate = new Date(currentMonth.getFullYear(), month, 1)
                if (!isFuture(startOfMonth(newDate)) && newDate >= binanceLaunchDate) {
                  onMonthChange(newDate)
                }
              }}
            >
              <SelectTrigger className="w-20 sm:w-24 h-8 text-xs sm:text-sm font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthDate = new Date(currentMonth.getFullYear(), i, 1)
                  const isFutureMonth = isFuture(startOfMonth(monthDate))
                  const isTooOld = monthDate < binanceLaunchDate

                  return (
                    <SelectItem
                      key={i}
                      value={i.toString()}
                      disabled={isFutureMonth || isTooOld}
                      className={isFutureMonth || isTooOld ? "opacity-50" : ""}
                    >
                      <span className="hidden sm:inline">{format(monthDate, "MMMM")}</span>
                      <span className="sm:hidden">{format(monthDate, "MMM")}</span>
                      {isFutureMonth && <span className="text-xs ml-1">(Future)</span>}
                      {isTooOld && <span className="text-xs ml-1">(Pre-2017)</span>}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            <Select
              value={currentMonth.getFullYear().toString()}
              onValueChange={(yearStr) => {
                const year = Number.parseInt(yearStr)
                const newDate = new Date(year, currentMonth.getMonth(), 1)
                if (!isFuture(startOfMonth(newDate)) && newDate >= binanceLaunchDate) {
                  onMonthChange(newDate)
                }
              }}
            >
              <SelectTrigger className="w-16 sm:w-20 h-8 text-xs sm:text-sm font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 8 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {isFuture(startOfMonth(currentMonth)) && (
            <p className="text-xs text-orange-600 mt-1">Future month - limited data</p>
          )}

          {currentMonth < binanceLaunchDate && (
            <p className="text-xs text-red-600 mt-1">Pre-Binance era - no data available</p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("next")}
          className="h-8 w-8 p-0 shrink-0"
          disabled={isNextMonthFuture}
          title={isNextMonthFuture ? "Cannot view future months" : "Next month"}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick navigation shortcuts - Hidden on mobile */}
      <div className="hidden sm:flex justify-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          onClick={() => {
            const now = new Date()
            const currentDate = now.getDate()
            if (currentDate <= 3) {
              onMonthChange(subMonths(now, 1))
            } else {
              onMonthChange(now)
            }
          }}
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          onClick={() => onMonthChange(subMonths(new Date(), 1))}
        >
          Last Month
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          onClick={() => onMonthChange(subMonths(new Date(), 12))}
        >
          1 Year Ago
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          onClick={() => onMonthChange(new Date(2022, 0, 1))}
        >
          2022
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          onClick={() => onMonthChange(new Date(2021, 0, 1))}
        >
          2021
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          onClick={() => onMonthChange(new Date(2020, 0, 1))}
        >
          2020
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-1 sm:p-2">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayData = getDataForDate(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isToday = isSameDay(day, new Date())
          const isFutureDate = isFuture(day)
          const isPreBinance = day < binanceLaunchDate

          return (
            <CalendarCell
              key={day.toISOString()}
              date={day}
              data={dayData}
              isSelected={isSelected}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              isFuture={isFutureDate || isPreBinance}
              viewMode={viewMode}
              onClick={() => handleDateClick(day)}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={handleMouseLeave}
              expandedView={expandedView}
            />
          )
        })}
      </div>

      {/* Data availability notice */}
      {data.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4 bg-muted/20 rounded-lg">
          {currentMonth < binanceLaunchDate ? (
            <>
              No trading data available for {format(currentMonth, "MMMM yyyy")}
              <br />
              <span className="text-xs">Binance launched in July 2017. Try selecting a more recent date.</span>
            </>
          ) : (
            <>
              No trading data available for {format(currentMonth, "MMMM yyyy")}
              <br />
              <span className="text-xs">Try selecting a different month or trading pair</span>
            </>
          )}
        </div>
      )}
    </div>
  )

  const renderWeeklyView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("prev")}
          className="h-8 w-8 p-0"
          disabled={isPrevMonthTooOld}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base sm:text-lg font-semibold text-center flex-1">
          <span className="hidden sm:inline">{format(currentMonth, "MMMM yyyy")} - Weekly View</span>
          <span className="sm:hidden">{format(currentMonth, "MMM yyyy")} - Weekly</span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("next")}
          className="h-8 w-8 p-0"
          disabled={isNextMonthFuture}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {weeks.map((weekStart, index) => {
          const weekEnd = endOfWeek(weekStart)
          const weekData = data.filter((item) => {
            const itemDate = new Date(item.date)
            return itemDate >= weekStart && itemDate <= weekEnd
          })

          const avgVolatility = weekData.reduce((sum, item) => sum + item.volatility, 0) / weekData.length || 0
          const totalVolume = weekData.reduce((sum, item) => sum + item.volume, 0)
          const weekPerformance =
            weekData.length > 0
              ? (((weekData[weekData.length - 1]?.close || 0) - (weekData[0]?.open || 0)) / (weekData[0]?.open || 1)) *
                100
              : 0

          // Don't allow selection of future weeks or pre-Binance weeks
          const isFutureWeek = isFuture(weekStart)
          const isPreBinanceWeek = weekStart < binanceLaunchDate

          return (
            <div
              key={index}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg transition-colors ${
                isFutureWeek || isPreBinanceWeek ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"
              }`}
              onClick={() => !(isFutureWeek || isPreBinanceWeek) && onRangeSelect({ start: weekStart, end: weekEnd })}
            >
              <div className="flex-1 mb-2 sm:mb-0">
                <div className="font-medium text-sm sm:text-base">
                  Week {index + 1}: {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d")}
                  {isFutureWeek && <span className="text-xs text-orange-600 ml-2">(Future)</span>}
                  {isPreBinanceWeek && <span className="text-xs text-red-600 ml-2">(Pre-2017)</span>}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{weekData.length} trading days</div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:space-x-4 text-xs sm:text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground">Volatility</div>
                  <div
                    className={`font-medium ${avgVolatility > 2 ? "text-red-500" : avgVolatility > 1 ? "text-yellow-500" : "text-green-500"}`}
                  >
                    {avgVolatility.toFixed(2)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Volume</div>
                  <div className="font-medium">{(totalVolume / 1000000).toFixed(1)}M</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Performance</div>
                  <div className={`font-medium ${weekPerformance >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {weekPerformance >= 0 ? "+" : ""}
                    {weekPerformance.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderMonthlyView = () => {
    const monthlyData = data.reduce(
      (acc, item) => {
        const month = format(new Date(item.date), "yyyy-MM")
        if (!acc[month]) {
          acc[month] = []
        }
        acc[month].push(item)
        return acc
      },
      {} as Record<string, MarketData[]>,
    )

    return (
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-center">Monthly Overview</h2>
        <div className="grid gap-4">
          {Object.entries(monthlyData).map(([month, monthData]) => {
            const avgVolatility = monthData.reduce((sum, item) => sum + item.volatility, 0) / monthData.length
            const totalVolume = monthData.reduce((sum, item) => sum + item.volume, 0)
            const monthPerformance =
              monthData.length > 0
                ? (((monthData[monthData.length - 1]?.close || 0) - (monthData[0]?.open || 0)) /
                    (monthData[0]?.open || 1)) *
                  100
                : 0

            const monthStart = new Date(month + "-01")
            const monthEnd = endOfMonth(monthStart)
            const isFutureMonth = isFuture(monthStart)
            const isPreBinanceMonth = monthStart < binanceLaunchDate

            return (
              <div
                key={month}
                className={`p-4 border rounded-lg transition-colors ${
                  isFutureMonth || isPreBinanceMonth
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted/50 cursor-pointer"
                }`}
                onClick={() => {
                  if (!(isFutureMonth || isPreBinanceMonth)) {
                    onRangeSelect({ start: monthStart, end: monthEnd })
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="mb-3 sm:mb-0">
                    <div className="font-medium text-base sm:text-lg">
                      {format(monthStart, "MMMM yyyy")}
                      {isFutureMonth && <span className="text-xs text-orange-600 ml-2">(Future)</span>}
                      {isPreBinanceMonth && <span className="text-xs text-red-600 ml-2">(Pre-2017)</span>}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{monthData.length} trading days</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground">Avg Volatility</div>
                      <div
                        className={`font-medium ${avgVolatility > 2 ? "text-red-500" : avgVolatility > 1 ? "text-yellow-500" : "text-green-500"}`}
                      >
                        {avgVolatility.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Total Volume</div>
                      <div className="font-medium">{(totalVolume / 1000000).toFixed(1)}M</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Performance</div>
                      <div className={`font-medium ${monthPerformance >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {monthPerformance >= 0 ? "+" : ""}
                        {monthPerformance.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {viewMode === "daily" && renderDailyView()}
      {viewMode === "weekly" && renderWeeklyView()}
      {viewMode === "monthly" && renderMonthlyView()}

      {hoveredDate && (
        <CalendarTooltip date={hoveredDate} data={getDataForDate(hoveredDate)} position={tooltipPosition} />
      )}
    </div>
  )
}
