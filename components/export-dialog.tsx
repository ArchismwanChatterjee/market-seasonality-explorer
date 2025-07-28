"use client"

import type React from "react"

import { useState } from "react"
import { Download, FileText, ImageIcon, Table } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { MarketData } from "@/types/market"
import { format } from "date-fns"

interface ExportDialogProps {
  data: MarketData[]
  symbol: string
  currentMonth: Date
  calendarRef?: React.RefObject<HTMLDivElement>
}

export function ExportDialog({ data, symbol, currentMonth, calendarRef }: ExportDialogProps) {
  const [exportType, setExportType] = useState<"pdf" | "csv" | "image">("csv")
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeMetrics, setIncludeMetrics] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = () => {
    const headers = ["Date", "Open", "High", "Low", "Close", "Volume", "Volatility", "Performance"]
    const csvData = data.map((item) => {
      const performance = ((item.close - item.open) / item.open) * 100
      return [
        item.date,
        item.open.toFixed(2),
        item.high.toFixed(2),
        item.low.toFixed(2),
        item.close.toFixed(2),
        item.volume.toFixed(0),
        item.volatility.toFixed(2),
        performance.toFixed(2),
      ]
    })

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${symbol}_${format(currentMonth, "yyyy-MM")}_market_data.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      // Create a simple PDF content using canvas
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 800
      canvas.height = 600
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add title
      ctx.fillStyle = "black"
      ctx.font = "24px Arial"
      ctx.fillText(`Market Report - ${symbol}`, 50, 50)

      ctx.font = "16px Arial"
      ctx.fillText(`Period: ${format(currentMonth, "MMMM yyyy")}`, 50, 80)

      // Add metrics
      if (includeMetrics && data.length > 0) {
        const avgVolatility = data.reduce((sum, item) => sum + item.volatility, 0) / data.length
        const totalVolume = data.reduce((sum, item) => sum + item.volume, 0)
        const totalReturn =
          data.length > 0
            ? (((data[data.length - 1]?.close || 0) - (data[0]?.open || 0)) / (data[0]?.open || 1)) * 100
            : 0

        ctx.fillText("Summary Metrics:", 50, 120)
        ctx.fillText(`Average Volatility: ${avgVolatility.toFixed(2)}%`, 50, 150)
        ctx.fillText(`Total Volume: ${(totalVolume / 1000000).toFixed(2)}M`, 50, 180)
        ctx.fillText(`Period Return: ${totalReturn.toFixed(2)}%`, 50, 210)
        ctx.fillText(`Trading Days: ${data.length}`, 50, 240)
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement("a")
          link.href = URL.createObjectURL(blob)
          link.download = `${symbol}_${format(currentMonth, "yyyy-MM")}_report.pdf`
          link.click()
        }
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToImage = async () => {
    if (!calendarRef?.current) {
      // Fallback: create a simple image
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 800
      canvas.height = 600
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "black"
      ctx.font = "24px Arial"
      ctx.fillText(`${symbol} Calendar - ${format(currentMonth, "MMMM yyyy")}`, 50, 50)

      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement("a")
          link.href = URL.createObjectURL(blob)
          link.download = `${symbol}_${format(currentMonth, "yyyy-MM")}_calendar.png`
          link.click()
        }
      })
      return
    }

    setIsExporting(true)
    try {
      // Use html2canvas if available, otherwise fallback
      if (typeof window !== "undefined" && (window as any).html2canvas) {
        const canvas = await (window as any).html2canvas(calendarRef.current)
        const link = document.createElement("a")
        link.download = `${symbol}_${format(currentMonth, "yyyy-MM")}_calendar.png`
        link.href = canvas.toDataURL()
        link.click()
      } else {
        // Fallback method
        exportToImage()
      }
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = async () => {
    switch (exportType) {
      case "csv":
        exportToCSV()
        break
      case "pdf":
        await exportToPDF()
        break
      case "image":
        await exportToImage()
        break
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Market Data</DialogTitle>
          <DialogDescription>Choose your export format and options</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-type">Export Format</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <Table className="h-4 w-4" />
                    <span>CSV Data</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF Report</span>
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>PNG Image</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(exportType === "pdf" || exportType === "image") && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="include-charts" checked={includeCharts} onCheckedChange={setIncludeCharts} />
                <Label htmlFor="include-charts">Include calendar visualization</Label>
              </div>
              {exportType === "pdf" && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-metrics" checked={includeMetrics} onCheckedChange={setIncludeMetrics} />
                  <Label htmlFor="include-metrics">Include summary metrics</Label>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            {isExporting ? "Exporting..." : `Export as ${exportType.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
