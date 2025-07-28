"use client"

import { useState } from "react"
import { CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, isFuture, startOfMonth, subMonths } from "date-fns"

interface QuickDatePickerProps {
  currentMonth: Date
  onMonthChange: (month: Date) => void
  className?: string
}

export function QuickDatePicker({ currentMonth, onMonthChange, className }: QuickDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const quickOptions = [
    {
      label: "Current Month",
      action: () => {
        const now = new Date()
        const currentDate = now.getDate()
        // If early in month, show previous month for better data
        if (currentDate <= 3) {
          onMonthChange(subMonths(now, 1))
        } else {
          onMonthChange(now)
        }
      },
    },
    {
      label: "Last Month",
      action: () => onMonthChange(subMonths(new Date(), 1)),
    },
    {
      label: "3 Months Ago",
      action: () => onMonthChange(subMonths(new Date(), 3)),
    },
    {
      label: "6 Months Ago",
      action: () => onMonthChange(subMonths(new Date(), 6)),
    },
    {
      label: "1 Year Ago",
      action: () => onMonthChange(subMonths(new Date(), 12)),
    },
    {
      label: "2 Years Ago",
      action: () => onMonthChange(subMonths(new Date(), 24)),
    },
    {
      label: "3 Years Ago",
      action: () => onMonthChange(subMonths(new Date(), 36)),
    },
    {
      label: "5 Years Ago",
      action: () => onMonthChange(subMonths(new Date(), 60)),
    },
  ]

  const handleQuickSelect = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const handleMonthYearChange = (month: number, year: number) => {
    const newDate = new Date(year, month, 1)
    const binanceLaunchDate = new Date(2017, 6, 1) // July 2017

    if (!isFuture(startOfMonth(newDate)) && newDate >= binanceLaunchDate) {
      onMonthChange(newDate)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`justify-start text-left font-normal ${className}`}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(currentMonth, "MMMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Quick Date Selection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Month/Year Selection */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Select Month & Year</div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={currentMonth.getMonth().toString()}
                  onValueChange={(monthStr) => {
                    const month = Number.parseInt(monthStr)
                    handleMonthYearChange(month, currentMonth.getFullYear())
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDate = new Date(currentMonth.getFullYear(), i, 1)
                      const isFutureMonth = isFuture(startOfMonth(monthDate))
                      const binanceLaunchDate = new Date(2017, 6, 1)
                      const isTooOld = monthDate < binanceLaunchDate

                      return (
                        <SelectItem key={i} value={i.toString()} disabled={isFutureMonth || isTooOld}>
                          {format(monthDate, "MMMM")}
                          {isFutureMonth && <span className="text-xs ml-1">(Future)</span>}
                          {isTooOld && <span className="text-xs ml-1">(Pre-Binance)</span>}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                <Select
                  value={currentMonth.getFullYear().toString()}
                  onValueChange={(yearStr) => {
                    const year = Number.parseInt(yearStr)
                    handleMonthYearChange(currentMonth.getMonth(), year)
                  }}
                >
                  <SelectTrigger className="h-8">
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
            </div>

            {/* Quick Options */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Quick Options</div>
              <div className="grid grid-cols-2 gap-2">
                {quickOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs justify-start"
                    onClick={() => handleQuickSelect(option.action)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Selection */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Selected:</span>
                <Badge variant="outline">{format(currentMonth, "MMM yyyy")}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
