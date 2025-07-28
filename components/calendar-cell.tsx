"use client"

import type React from "react"

import { format } from "date-fns"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { MarketData, ViewMode } from "@/types/market"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/theme-context"

interface CalendarCellProps {
  date: Date
  data?: MarketData
  isSelected: boolean
  isCurrentMonth: boolean
  isToday: boolean
  isFuture: boolean
  viewMode: ViewMode
  onClick: () => void
  onMouseEnter: (event: React.MouseEvent) => void
  onMouseLeave: () => void
  expandedView?: boolean
}

export function CalendarCell({
  date,
  data,
  isSelected,
  isCurrentMonth,
  isToday,
  isFuture,
  viewMode,
  onClick,
  onMouseEnter,
  onMouseLeave,
  expandedView = false,
}: CalendarCellProps) {
  const { getVolatilityColor, getPerformanceColor } = useTheme()

  const getPerformanceIcon = (performance: number) => {
    if (performance > 0.5) return <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3" />
    if (performance < -0.5) return <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3" />
    return <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
  }

  const performance = data ? ((data.close - data.open) / data.open) * 100 : 0

  const cellHeight = expandedView ? "h-16 sm:h-20 md:h-24" : "h-12 sm:h-14 md:h-16"

  return (
    <div
      className={cn(
        `relative ${cellHeight} w-full border border-border rounded-md transition-all duration-200`,
        isFuture ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:scale-105 hover:shadow-md",
        isSelected && "ring-1 sm:ring-2 ring-primary ring-offset-1 sm:ring-offset-2",
        isToday && "ring-1 ring-blue-400",
        !isCurrentMonth && "opacity-50",
        data && !isFuture && getVolatilityColor(data.volatility),
        (!data || isFuture) && "bg-muted/20",
      )}
      onClick={isFuture ? undefined : onClick}
      onMouseEnter={isFuture ? undefined : onMouseEnter}
      onMouseLeave={isFuture ? undefined : onMouseLeave}
    >
      {/* Date number */}
      <div
        className={cn(
          "absolute top-0.5 sm:top-1 left-0.5 sm:left-1 text-xs font-medium",
          isFuture ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {format(date, "d")}
      </div>

      {/* Future indicator */}
      {isFuture && (
        <div className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 text-xs text-muted-foreground">?</div>
      )}

      {/* Performance indicator - only for past dates with data */}
      {data && !isFuture && (
        <div className={`absolute top-0.5 sm:top-1 right-0.5 sm:right-1 ${getPerformanceColor(performance)}`}>
          {getPerformanceIcon(performance)}
        </div>
      )}

      {/* Additional data for expanded view */}
      {expandedView && data && !isFuture && (
        <div className="absolute top-1/2 left-0 right-0 text-center text-xs">
          <span className={performance >= 0 ? "text-green-500" : "text-red-500"}>
            {performance >= 0 ? "+" : ""}
            {performance.toFixed(1)}%
          </span>
        </div>
      )}

      {/* Volume bar - only for past dates with data */}
      {data && !isFuture && (
        <div className="absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1 right-0.5 sm:right-1">
          <div
            className="h-0.5 sm:h-1 bg-foreground/60 rounded-full"
            style={{
              width: `${Math.min(100, (data.volume / 10000000) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* Liquidity pattern overlay - only for past dates with high volume */}
      {data && !isFuture && data.volume > 5000000 && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent rounded-md" />
      )}

      {/* Today indicator */}
      {isToday && (
        <div className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 h-2 w-2 sm:h-3 sm:w-3 bg-blue-500 rounded-full border-1 sm:border-2 border-background" />
      )}
    </div>
  )
}
