"use client"

import { format } from "date-fns"
import type { MarketData } from "@/types/market"
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react"

interface CalendarTooltipProps {
  date: Date
  data?: MarketData
  position: { x: number; y: number }
}

export function CalendarTooltip({ date, data, position }: CalendarTooltipProps) {
  if (!data) {
    return (
      <div
        className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-3 pointer-events-none"
        style={{
          left: position.x + 10,
          top: position.y - 10,
          transform: "translateY(-100%)",
        }}
      >
        <div className="text-sm font-medium">{format(date, "MMMM d, yyyy")}</div>
        <div className="text-xs text-muted-foreground">No trading data available</div>
      </div>
    )
  }

  const performance = ((data.close - data.open) / data.open) * 100
  const priceRange = data.high - data.low

  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-4 pointer-events-none min-w-64"
      style={{
        left: Math.min(position.x + 10, window.innerWidth - 280),
        top: position.y - 10,
        transform: "translateY(-100%)",
      }}
    >
      <div className="text-sm font-medium mb-2">{format(date, "MMMM d, yyyy")}</div>

      <div className="space-y-2 text-xs">
        {/* Price Information */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-muted-foreground">Open</div>
            <div className="font-medium">${data.open.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Close</div>
            <div className="font-medium">${data.close.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-muted-foreground">High</div>
            <div className="font-medium text-green-500">${data.high.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Low</div>
            <div className="font-medium text-red-500">${data.low.toLocaleString()}</div>
          </div>
        </div>

        {/* Performance */}
        <div className="flex items-center space-x-2">
          {performance >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className="text-muted-foreground">Performance:</span>
          <span className={`font-medium ${performance >= 0 ? "text-green-500" : "text-red-500"}`}>
            {performance >= 0 ? "+" : ""}
            {performance.toFixed(2)}%
          </span>
        </div>

        {/* Volatility */}
        <div className="flex items-center space-x-2">
          <Activity className="h-3 w-3 text-orange-500" />
          <span className="text-muted-foreground">Volatility:</span>
          <span
            className={`font-medium ${
              data.volatility > 2 ? "text-red-500" : data.volatility > 1 ? "text-yellow-500" : "text-green-500"
            }`}
          >
            {data.volatility.toFixed(2)}%
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">Volume:</span>
          <span className="font-medium">{(data.volume / 1000000).toFixed(2)}M</span>
        </div>

        {/* Price Range */}
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground">Range:</span>
          <span className="font-medium">
            ${priceRange.toLocaleString()} ({((priceRange / data.open) * 100).toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
